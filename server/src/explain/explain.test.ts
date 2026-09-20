import { describe, it, expect } from 'vitest';
import { truncateContent } from './index.js';
import { MockProvider, getProvider } from './providers.js';

describe('truncateContent', () => {
  it('truncates large content', () => {
    const large = 'a'.repeat(10000);
    const truncated = truncateContent(large, 5000);
    expect(truncated.length).toBeLessThan(10000);
    expect(truncated.endsWith('[TRUNCATED]')).toBe(true);
  });
});

describe('Providers', () => {
  it('MockProvider returns deterministic response', async () => {
    const p = new MockProvider();
    const res1 = await p.complete('REPO EXPLANATION');
    expect(res1).toContain('Mocked');
    
    const res2 = await p.complete('FILE EXPLANATION');
    expect(res2).toContain('Mocked');
  });

  it('getProvider returns MockProvider in test env', () => {
    const p = getProvider();
    expect(p instanceof MockProvider).toBe(true);
  });
});
