import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

async function test() {
  try {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = streamText({
      model: google('gemini-flash-latest'),
      messages,
      system: 'You are an AI assistant.'
    });
    console.log('streamText called successfully');
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
