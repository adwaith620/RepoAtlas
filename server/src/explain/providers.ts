import Anthropic from '@anthropic-ai/sdk';

export interface LLMProvider {
  complete(prompt: string, opts?: any): Promise<string>;
}

export class MockProvider implements LLMProvider {
  async complete(prompt: string, opts?: any): Promise<string> {
    if (prompt.includes('FILE EXPLANATION')) {
      return "This file handles core application logic. It interacts with its dependencies to process data. (Mocked)";
    }
    return "1. Project Summary: A mock project.\n2. Architecture Overview: Client-server architecture.\n3. Onboarding Guide: Start with index.js for initialization. (Mocked)";
  }
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(prompt: string, opts?: any): Promise<string> {
    const msg = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: 'You are an expert software engineer. Stay grounded in the provided code. If information is missing, say "unclear from the code" instead of guessing.',
      messages: [{ role: 'user', content: prompt }]
    });
    return (msg.content[0] as any).text;
  }
}

export function getProvider(): LLMProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (process.env.NODE_ENV === 'test' || !key) {
    return new MockProvider();
  }
  return new AnthropicProvider(key);
}
