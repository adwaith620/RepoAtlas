import { describe, it, expect } from 'vitest';
import { filterAndSortTree } from './github.js';

describe('filterAndSortTree', () => {
  it('removes node_modules, dist, etc.', () => {
    const files = [
      { type: 'blob', path: 'src/main.ts', size: 100 },
      { type: 'blob', path: 'node_modules/pkg/index.js', size: 100 },
      { type: 'blob', path: 'dist/bundle.js', size: 100 },
      { type: 'blob', path: '.git/config', size: 100 },
    ];
    const res = filterAndSortTree(files);
    expect(res.tree).toHaveLength(1);
    expect(res.tree[0].path).toBe('src/main.ts');
  });

  it('removes large files, lockfiles, minified files, images', () => {
    const files = [
      { type: 'blob', path: 'src/huge.ts', size: 300 * 1024 },
      { type: 'blob', path: 'package-lock.json', size: 100 },
      { type: 'blob', path: 'vendor.min.js', size: 100 },
      { type: 'blob', path: 'logo.png', size: 100 },
      { type: 'blob', path: 'src/small.ts', size: 10 * 1024 },
    ];
    const res = filterAndSortTree(files);
    expect(res.tree).toHaveLength(1);
    expect(res.tree[0].path).toBe('src/small.ts');
  });

  it('prioritizes src/ and lib/ over other files', () => {
    const files = [
      { type: 'blob', path: 'docs/readme.md', size: 100 },
      { type: 'blob', path: 'src/index.ts', size: 100 },
      { type: 'blob', path: 'lib/utils.ts', size: 100 },
      { type: 'blob', path: 'random.js', size: 100 },
    ];
    const res = filterAndSortTree(files);
    expect(res.tree[0].path).toBe('lib/utils.ts');
    expect(res.tree.slice(0, 2).map(f => f.path).sort()).toEqual(['lib/utils.ts', 'src/index.ts']);
  });

  it('truncates at 400 files', () => {
    const files = Array.from({ length: 450 }).map((_, i) => ({
      type: 'blob',
      path: `src/file${i}.ts`,
      size: 100
    }));
    const res = filterAndSortTree(files);
    expect(res.tree).toHaveLength(400);
    expect(res.truncated).toBe(true);
  });
});
