import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Pinecone } from '@pinecone-database/pinecone';

export async function searchImages(query: string, userEmail: string = 'guest') {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  // If no query is provided, we do a generic search to return the latest/all assets.
  // "visual asset document photo" is a generic anchor that should match most uploaded things.
  const searchQuery = query.trim() ? query : "visual asset document photo";

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: searchQuery,
  });

  const results = await index.query({
    vector: embedding,
    topK: query.trim() ? 20 : 50, // Get more if it's the default view
    includeMetadata: true,
    filter: {
      userEmail: { $eq: userEmail }
    }
  });

  // Sort by uploadedAt descending if available
  const matches = results.matches.map(match => match.metadata as any);
  matches.sort((a, b) => {
    if (a.uploadedAt && b.uploadedAt) {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    return 0;
  });

  return matches;
}

export async function searchDocuments(query: string) {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  const results = await index.query({
    vector: embedding,
    topK: 10,
    includeMetadata: true,
  });

  return results.matches.map(match => match.metadata as any);
}
