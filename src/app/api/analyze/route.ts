import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { analyzeFile, AnalysisMode } from '@/app/actions/analyze';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as AnalysisMode) || 'summary';

    const customOpenAiKey = req.headers.get('x-custom-openai-key') || undefined;
    const customAnthropicKey = req.headers.get('x-custom-anthropic-key') || undefined;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    // 1. Perform analysis using the server action
    const actionFormData = new FormData();
    actionFormData.append('file', file);

    const result = await analyzeFile(actionFormData, mode, { customOpenAiKey, customAnthropicKey });

    // Get the current user session
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || 'guest';

    // 2. Optionally upload to Vercel Blob (non-blocking, best-effort)
    let imageUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blobPath = session?.user?.email ? `${session.user.email}/${file.name}` : `guest/${file.name}`;
        const blob = await put(blobPath, file, { access: 'public' });
        imageUrl = blob.url;
      } catch (blobError) {
        console.warn('Blob upload skipped (optional):', blobError);
      }
    }

    // 3. Optionally store embedding in Pinecone (non-blocking, best-effort)
    if (
      mode === 'summary' &&
      (result as any).summary &&
      process.env.PINECONE_API_KEY &&
      process.env.PINECONE_INDEX_NAME &&
      process.env.OPENAI_API_KEY
    ) {
      try {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: (result as any).summary,
        });

        const { Pinecone } = await import('@pinecone-database/pinecone');
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

        await index.upsert([
          {
            id: crypto.randomUUID(),
            values: embedding,
            metadata: {
              description: (result as any).summary,
              imageUrl: imageUrl || '',
              timestamp: new Date().toISOString(),
              mode: mode,
              userEmail: userEmail,
            },
          }
        ] as any);
      } catch (pineconeError) {
        console.warn('Pinecone storage skipped (optional):', pineconeError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Vision Pipeline Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
