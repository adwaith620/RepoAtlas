import { describe, it, expect } from 'vitest';
import { parseImports, resolveImport } from './imports.js';

describe('parseImports', () => {
  it('parses JS/TS imports', () => {
    const content = `
      import React from 'react';
      import { helper } from './utils/helper.js';
      const _ = require('lodash');
      export { something } from '../parent.ts';
      const dynamic = await import('@/components/Button');
    `;
    const res = parseImports('src/main.ts', content);
    expect(res).toEqual(expect.arrayContaining([
      { specifier: 'react', type: 'package' },
      { specifier: './utils/helper.js', type: 'relative' },
      { specifier: 'lodash', type: 'package' },
      { specifier: '../parent.ts', type: 'relative' },
      { specifier: '@/components/Button', type: 'relative' }
    ]));
  });

  it('parses Python imports', () => {
    const content = `
from os import path
import sys, json
from . import local_mod
from ..parent import something
    `;
    const res = parseImports('main.py', content);
    expect(res).toEqual(expect.arrayContaining([
      { specifier: 'os', type: 'package' },
      { specifier: 'sys', type: 'package' },
      { specifier: 'json', type: 'package' },
      { specifier: '.', type: 'relative' },
      { specifier: '..parent', type: 'relative' }
    ]));
  });
});

describe('resolveImport', () => {
  const fileSet = new Set(['src/index.ts', 'src/utils/helper.ts', 'src/components/Button/index.tsx', 'lib/math.js']);

  it('resolves exactly', () => {
    expect(resolveImport('src/index.ts', './utils/helper.ts', fileSet)).toBe('src/utils/helper.ts');
  });
  it('resolves with missing extension', () => {
    expect(resolveImport('src/index.ts', './utils/helper', fileSet)).toBe('src/utils/helper.ts');
  });
  it('resolves index file', () => {
    expect(resolveImport('src/index.ts', './components/Button', fileSet)).toBe('src/components/Button/index.tsx');
  });
  it('resolves ../', () => {
    expect(resolveImport('src/utils/helper.ts', '../index', fileSet)).toBe('src/index.ts');
  });
  it('returns null for external', () => {
    expect(resolveImport('src/index.ts', 'react', fileSet)).toBe(null);
  });
});
