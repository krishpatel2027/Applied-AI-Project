import { streamText } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages: rawMessages, model: requestedModel, analysisData } = await req.json();

    // Read custom headers
    const customOpenAiKey = req.headers.get('x-custom-openai-key');

    // Create custom providers if keys are provided
    const openaiProvider = customOpenAiKey ? createOpenAI({ apiKey: customOpenAiKey }) : openai;

    // Safely convert messages without relying on buggy convertToModelMessages
    const messages = (rawMessages || []).map((msg: any) => {
      // If it's already an array of parts (CoreMessage format), use it directly
      if (Array.isArray(msg.content)) {
        return { role: msg.role, content: msg.content };
      }
      
      const parts: any[] = [];
      
      // Text part
      if (msg.content && typeof msg.content === 'string') {
        parts.push({ type: 'text', text: msg.content });
      }

      // Handle experimental_attachments
      if (msg.experimental_attachments && Array.isArray(msg.experimental_attachments)) {
        for (const att of msg.experimental_attachments) {
          parts.push({ type: 'image', image: att.url || att.data });
        }
      }
      
      // Handle explicit parts array if present
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text) {
            // Only add text if we didn't already add it from msg.content
            if (!parts.some(p => p.type === 'text' && p.text === part.text)) {
              parts.push({ type: 'text', text: part.text });
            }
          } else if (part.type === 'file' || part.type === 'image') {
            parts.push({ type: 'image', image: part.url || part.data || part.base64 });
          }
        }
      }

      // Fallback to simple string content if no images are attached
      if (parts.length === 1 && parts[0].type === 'text') {
        return { role: msg.role, content: parts[0].text };
      }

      return { role: msg.role, content: parts.length > 0 ? parts : msg.content };
    });

    // If client requested a specific model, prioritize it, otherwise fallback chain
    const targetModelStr = requestedModel || 'gemini-2.5-flash';
    
    // Normalize legacy model names to current ones
    const normalizeModel = (modelStr: string): string => {
      const legacyMap: Record<string, string> = {
        'gemini-1.5-pro-latest': 'gemini-2.5-pro',
        'gemini-1.5-pro': 'gemini-2.5-pro',
        'gemini-1.5-flash-latest': 'gemini-2.5-flash',
        'gemini-1.5-flash': 'gemini-2.5-flash',
        'gemini-flash-latest': 'gemini-2.5-flash',
        'gemini-pro-latest': 'gemini-2.5-pro',
      };
      return legacyMap[modelStr] || modelStr;
    };

    const getTargetModel = (modelStr: string) => {
      const normalized = normalizeModel(modelStr);
      if (normalized.includes('gpt')) return openaiProvider(normalized);
      // Default to Google for all gemini/other models
      return google(normalized);
    };

    // Model fallback chain - prioritize Gemini (working API key), then OpenAI
    const models = [
      () => getTargetModel(targetModelStr),
      () => google('gemini-2.5-flash'),
      () => google('gemini-2.0-flash'),
      () => openaiProvider('gpt-4o-mini'),
      () => openaiProvider('gpt-4o'),
    ];

    let lastError: any = null;

    let systemPrompt = "You are an advanced AI vision assistant called Nexus AI. You provide detailed, analytical, and highly precise descriptions of images and documents. \n\nIMPORTANT: When answering questions, first use any provided context. However, if the user asks a general question, asks for detailed explanations, or requires information outside the immediate context, YOU MUST search your own vast internal knowledge base to provide a highly personalized, deeply detailed, and comprehensive answer. Do not limit yourself strictly to the image or document context if the user asks for more.\n\nRespond using concise, visually pleasing markdown formatting.";
    
    if (analysisData) {
      systemPrompt += `\n\nHere is the current analysis data for the active document/image for context:\n${JSON.stringify(analysisData)}`;
    }

    for (const getModel of models) {
      try {
        const result = streamText({
          model: getModel(),
          messages,
          system: systemPrompt,
        });

        // Use toUIMessageStreamResponse for compatibility with @ai-sdk/react v3 useChat
        return result.toUIMessageStreamResponse();
      } catch (error: any) {
        lastError = error;
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('quota') || msg.includes('rate') || msg.includes('429') || msg.includes('limit') || msg.includes('not found') || msg.includes('404')) {
          console.warn(`Chat model failed, trying next fallback...`);
          await new Promise(r => setTimeout(r, 500));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error('Chat API Error:', error.stack || error);
    return new Response(JSON.stringify({ error: error.message || 'Chat failed', stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
