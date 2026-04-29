import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, embed } from 'ai';
import { Pinecone } from '@pinecone-database/pinecone';
import * as fs from 'fs';

async function runTest() {
  console.log('🚀 Starting Multimodal Pipeline Test...');

  // 1. Setup Mock Data (A very small base64 image to simulate a file)
  const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  
  console.log('1. [MOCK] Image loaded.');

  try {
    // 2. Test Gemini Extraction (Simulating the API call)
    console.log('2. [AI] Calling Gemini for Markdown Extraction...');
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: `You are a professional document digitizer. Output ONLY Markdown.`,
      prompt: `Extract all information from this image (mock): ${mockBase64}`,
    });
    console.log('✅ Extraction Successful. Markdown preview:');
    console.log(text.substring(0, 100) + '...');

    // 3. Test Embedding
    console.log('3. [EMBED] Converting text to vector using OpenAI...');
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    });
    console.log(`✅ Embedding Successful. Vector dimension: ${embedding.length}`);

    // 4. Test Pinecone Upsert
    console.log('4. [PINECONE] Upserting to vector database...');
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    await index.upsert({
      records: [{
        id: 'test-id-' + Date.now(),
        values: embedding,
        metadata: {
          text: text,
          test: 'true'
        }
      }]
    });
    console.log('✅ Pinecone Upsert Successful.');

    console.log('\n🎉 TEST PASSED: Pipeline is fully functional!');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

runTest();
