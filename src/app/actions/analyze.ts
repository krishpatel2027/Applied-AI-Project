// Server-side analysis logic

import { generateObject } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createHash } from 'crypto';

// Simple in-memory cache to avoid re‑processing identical files within this server instance
const analysisCache = new Map<string, any>();

export type AnalysisMode = 'summary' | 'flashcards' | 'mindmap' | 'highlights';

const MODEL_CHAIN: { name: string; provider: string; textOnly?: boolean }[] = [
  // Gemini flash model - fast and reliable with working API key
  { name: 'gemini-2.5-flash', provider: 'google' },
  // Gemini 2.0 flash fallback
  { name: 'gemini-2.0-flash', provider: 'google' },
  // Fast, cheap OpenAI model (fallback)
  { name: 'gpt-4o-mini', provider: 'openai', textOnly: true },
  // General-purpose GPT-4o model
  { name: 'gpt-4o', provider: 'openai' },
  // Highest-quality Gemini model (slower)
  { name: 'gemini-2.5-pro', provider: 'google' },
];

async function generateWithFallback(
  options: any, 
  keys?: { customOpenAiKey?: string; customAnthropicKey?: string },
  chain: typeof MODEL_CHAIN = MODEL_CHAIN
) {
  let lastError: any = null;
  
  const openaiProvider = keys?.customOpenAiKey ? createOpenAI({ apiKey: keys.customOpenAiKey }) : openai;
  // Anthropic model removed – using only Gemini and OpenAI providers

  const failedModels: string[] = [];

  for (const modelInfo of chain) {
    // Skip image/file processing if model is text-only
    if (modelInfo.textOnly && options.messages?.[0]?.content?.some?.((c: any) => c.type === 'image' || c.type === 'file')) {
      continue;
    }

    try {
      let model;
      if (modelInfo.provider === 'openai') {
        model = openaiProvider(modelInfo.name);
      } else {
        model = google(modelInfo.name);
      }

      // Sanitize messages based on provider capabilities
      const sanitizedMessages = options.messages.map((msg: any) => {
        if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg;

        return {
          ...msg,
          content: msg.content.filter((part: any) => {
            if (part.type === 'text') return true;
            
            const isPdf = part.mimeType === 'application/pdf' || 
                         (part.type === 'image' && part.image?.includes?.('application/pdf'));

            if (isPdf) {
              if (modelInfo.provider === 'google') {
                // Gemini prefers the 'image' multimodal hack for PDF in some SDK versions
                return part.type === 'image';
              }
              if (modelInfo.provider === 'anthropic') {
                // Claude requires the standard 'file' part for PDF
                return part.type === 'file';
              }
              if (modelInfo.provider === 'openai') {
                // OpenAI Vision doesn't support PDF, filter it out
                return false;
              }
            }
            
            // Keep images for all vision providers
            if (part.type === 'image') return true;
            if (part.type === 'file') return true;

            return true;
          })
        };
      });

      const result = await generateObject({
        ...options,
        messages: sanitizedMessages,
        model,
      });
      return result;
    } catch (error: any) {
      lastError = error;
      failedModels.push(`${modelInfo.name} (${error.message || 'Unknown error'})`);
      const msg = (error.message || '').toLowerCase();
      
      // If it's a quota/rate limit/not found/demand/balance error, try next model
      if (
        msg.includes('quota') || 
        msg.includes('rate') || 
        msg.includes('429') || 
        msg.includes('limit') ||
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('demand') ||
        msg.includes('unavailable') ||
        msg.includes('503') ||
        msg.includes('service') ||
        msg.includes('key') ||
        msg.includes('balance') ||
        msg.includes('credit') ||
        msg.includes('insufficient')
      ) {
        console.log(`[Analysis] Fallback: Model ${modelInfo.name} failed with ${msg.substring(0, 50)}... Trying next.`);
        // Small delay to let the rate limit breather
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      
      break; 
    }
  }
  
  throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown'}. Failed chain: ${failedModels.join(' -> ')}`);
}

// Extract text from PDF using pdf-parse
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error);
    return '';
  }
}

// Extract text from DOCX using mammoth
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return '';
  }
}

function createFallback(mode: AnalysisMode) {
  switch (mode) {
    case 'summary':
      return { summary: 'Unable to generate summary due to service limitations.' };
    case 'flashcards':
      return { flashcards: [{ question: 'N/A', answer: 'N/A' }] };
    case 'mindmap':
      return {
        nodes: [{ id: '1', label: 'Concept', type: 'concept' }],
        edges: [],
      };
    case 'highlights':
      return { highlights: ['Unable to generate highlights.'] };
  }
}

export async function analyzeFile(
  formData: FormData, 
  mode: AnalysisMode,
  keys?: { customOpenAiKey?: string; customAnthropicKey?: string }
) {
  const file = formData.get('file') as File;
  const requestedModel = formData.get('model') as string;
  console.log(`[Analysis] Requested Model: ${requestedModel}`);
  if (!file) throw new Error('No file provided');

  // Dynamically reorder the model chain to start with the requested model
  const customChain = [...MODEL_CHAIN];
  if (requestedModel) {
    const requestedIndex = customChain.findIndex(m => m.name === requestedModel);
    if (requestedIndex > -1) {
      const [model] = customChain.splice(requestedIndex, 1);
      customChain.unshift(model);
      console.log(`[Analysis] Chain reordered to start with: ${model.name}`);
    } else {
      console.log(`[Analysis] Requested model ${requestedModel} not found in chain.`);
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = file.type;
  // Compute a hash of the file contents to use for caching results per mode
  const fileHash = createHash('sha256').update(buffer).digest('hex');
  // Return cached analysis if available
  const cacheKey = `${fileHash}-${mode}`;
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey);
  }

  // Define schemas for each mode
  const schemas = {
    summary: z.object({
      summary: z.string().describe("A comprehensive and detailed summary of the content"),
    }),
    flashcards: z.object({
      flashcards: z.array(z.object({
        question: z.string().describe("A question based on the content"),
        answer: z.string().describe("The correct answer to the question"),
      })).min(3).max(10).describe("A list of flashcards for studying"),
    }),
    mindmap: z.object({
      nodes: z.array(z.object({
        id: z.string().describe("Unique identifier for the node"),
        label: z.string().describe("The text label for the concept"),
        type: z.enum(['concept', 'detail']).describe("The type of the node"),
      })).describe("Nodes representing concepts"),
      edges: z.array(z.object({
        source: z.string().describe("Source node ID"),
        target: z.string().describe("Target node ID"),
        relationship: z.string().describe("The relationship between the nodes"),
      })).describe("Edges representing relationships between concepts"),
    }),
    highlights: z.object({
      highlights: z.array(z.string()).min(3).max(10).describe("A list of key points and important highlights from the content"),
    }),
  };

  const currentSchema = schemas[mode];
  let extractedText = '';

  const prompts = {
    summary: "Analyze the provided content thoroughly and generate a comprehensive, well-structured summary. Use clear headings, bullet points, and bold text for key terms. Cover all main topics and important details in a way that is easy for a student to study.",
    flashcards: "Create a set of 8-12 high-quality flashcards (question and answer pairs) that cover the most critical concepts for exam preparation. Ensure questions are challenging and answers are concise yet complete.",
    mindmap: "Create a deeply structured mind map with a clear central concept and multiple levels of child and sub-child nodes. Focus on capturing the hierarchical relationship between ideas. Use 'concept' for main branches and 'detail' for granular information.",
    highlights: "Identify the 10 most impactful highlights and key takeaways. Present them as a numbered list with bold titles for each point followed by a brief explanation. Focus on 'aha!' moments and critical definitions.",
  };

  // Handle image files - send directly to vision model
  if (mimeType.startsWith('image/')) {
    const imageDataUrl = `data:${mimeType};base64,${base64}`;

try {
        const { object } = await generateWithFallback({
          schema: currentSchema,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompts[mode] },
                { type: 'image', image: imageDataUrl },
              ],
            },
          ],
        }, keys, customChain);
        // Cache result for this file/mode
        analysisCache.set(`${fileHash}-${mode}`, object);
        return object;
      } catch (err) {
        console.warn('[Analysis] AI failed. Returning fallback.', err);
        return createFallback(mode);
      }
  }

  // Handle PDF files - send directly to document understanding model
  if (mimeType === 'application/pdf') {
    try {
        try {
        const { object } = await generateWithFallback({
          schema: currentSchema,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompts[mode] },
                // Claude/Vercel AI SDK standard for PDF
                { type: 'file', data: buffer, mimeType: 'application/pdf' },
                // Fallback for Gemini multimodal support
                { type: 'image', image: `data:application/pdf;base64,${base64}` },
              ],
            },
          ],
        }, keys, customChain);
        // Cache result for this file/mode
        analysisCache.set(`${fileHash}-${mode}`, object);
        return object;
        } catch (err) {
          console.warn('[Analysis] AI failed. Returning fallback.', err);
          return createFallback(mode);
        }
    } catch (visionError) {
      console.warn('Native PDF vision failed, falling back to text extraction:', visionError);
      // If native vision fails, fallback to text extraction and proceed to text analysis block
      extractedText = await extractPdfText(buffer);
    }
  }

  // Handle other document files (Word, PPT) - extract text first, then analyze

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    extractedText = await extractDocxText(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    try {
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      const readableRatio = (extractedText.match(/[a-zA-Z0-9]/g) || []).length / extractedText.length;
      if (readableRatio < 0.3) {
        extractedText = `[PPTX file: ${file.name}] - Unable to extract clean text. The file contains primarily binary/encoded content.`;
      }
    } catch {
      extractedText = `[PPTX file: ${file.name}] - Unable to extract text from this file.`;
    }
  }

  if (!extractedText || extractedText.trim().length < 10) {
    extractedText = `File: ${file.name} (${mimeType}). Unable to extract meaningful text content from this file.`;
  }

  // Truncate if too long
  const maxChars = 30000;
  if (extractedText.length > maxChars) {
    extractedText = extractedText.substring(0, maxChars) + '\n\n[Content truncated for analysis...]';
  }

    try {
        const { object } = await generateWithFallback({
          schema: currentSchema,
          messages: [
            {
              role: 'user',
              content: `${prompts[mode]}\n\nDocument content:\n\n${extractedText}`,
            },
          ],
        }, keys, customChain);
        // Cache result for this file/mode
        analysisCache.set(`${fileHash}-${mode}`, object);
        return object;
    } catch (err) {
      console.warn('[Analysis] AI failed. Returning fallback.', err);
      return createFallback(mode);
    }

  return object;
}
