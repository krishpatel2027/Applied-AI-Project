import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateObject, embed } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { z } from 'zod';

export const runtime = 'nodejs';

// Increase max duration for Vercel functions since we do a lot of work
export const maxDuration = 60; 

// Lazy-init Pinecone client to avoid crashing if the key is not set
let _pc: Pinecone | null = null;
function getPinecone(): Pinecone | null {
  if (!process.env.PINECONE_API_KEY) return null;
  if (!_pc) {
    _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _pc;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Upload to Vercel Blob
    // We use a unique filename to prevent overwriting
const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
let blobUrl = '';
try {
  const blob = await put(blobName, file, {
    access: 'public',
  });
  blobUrl = blob.url;
} catch (blobError) {
  console.warn('Blob upload skipped (optional):', blobError);
}

    // 2. Extract Metadata with Gemini 3.1 Pro (via gemini-2.5-pro or flash depending on limits)
    // To send the image to Gemini via the AI SDK, we need to convert it to base64
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // We use gemini-2.5-flash for speed or pro if needed. Let's use flash as it's faster for tagging.
let metadata = {
  caption: '',
  tags: [],
  ocrText: '',
};
try {
  const { object } = await generateObject({
    model: google('gemini-flash-latest'),
    schema: z.object({
      caption: z.string().describe('A detailed 2-3 sentence description of the image content.'),
      tags: z.array(z.string()).describe('5-10 relevant tags or keywords for this image (e.g., #blueprint, #landscape).'),
      ocrText: z.string().describe('Any legible text found in the image. Return empty string if none.'),
    }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image and extract a detailed caption, relevant tags, and any OCR text.' },
          { type: 'file', mimeType, data: buffer }
        ],
      },
    ],
  });
  metadata = object;
} catch (err) {
  console.warn('Metadata generation failed:', err);
  metadata = { caption: 'No caption', tags: [], ocrText: '' };
}


    // 3. Generate Embeddings & Upsert to Pinecone (optional, best-effort)
    const pc = getPinecone();
    if (pc && process.env.PINECONE_INDEX_NAME && process.env.OPENAI_API_KEY) {
      try {
        const textToEmbed = `${metadata.caption} ${metadata.tags.join(' ')} ${metadata.ocrText}`;
        
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: textToEmbed,
        });

        const index = pc.index(process.env.PINECONE_INDEX_NAME);
        const vectorId = Buffer.from(blobUrl).toString('base64'); 
        
        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              url: blobUrl,
              filename: file.name,
              contentType: file.type,
              caption: metadata.caption,
              tags: metadata.tags,
              ocrText: metadata.ocrText,
              uploadedAt: new Date().toISOString(),
              size: file.size,
            },
          },
        ]);
      } catch (pineconeErr) {
        console.warn('Pinecone upsert skipped (optional):', pineconeErr);
      }
    }

    // Return the enriched data to the client
    return NextResponse.json({
      url: blobUrl,
      metadata: {
        caption: metadata.caption,
        tags: metadata.tags,
        ocrText: metadata.ocrText,
      }
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
