import { describe, it, expect, beforeEach } from 'vitest';
import { cache } from './index.js';

describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('caches repo analysis', () => {
    const data = { meta: { sha: '123' }, graph: { nodes: [], edges: [] } } as any;
    cache.saveRepo('owner/repo/123', data);
    const res = cache.getRepo('owner/repo/123');
    expect(res).toEqual(data);
    expect(cache.getRepo('owner/repo/456')).toBeNull();
  });

  it('caches file explanation', () => {
    cache.saveFile('owner/repo/123', 'src/a.ts', 'explanation');
    expect(cache.getFile('owner/repo/123', 'src/a.ts')).toBe('explanation');
    expect(cache.getFile('owner/repo/123', 'src/b.ts')).toBeNull();
  });
});
