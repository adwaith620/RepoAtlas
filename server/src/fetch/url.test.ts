import { describe, it, expect } from 'vitest';
import { parseRepoUrl } from './url.js';
import { InvalidUrlError } from './errors.js';

describe('parseRepoUrl', () => {
  it('parses standard github url', () => {
    expect(parseRepoUrl('https://github.com/expressjs/express')).toEqual({ owner: 'expressjs', repo: 'express', branch: undefined });
  });
  it('handles www prefix', () => {
    expect(parseRepoUrl('https://www.github.com/a/b')).toEqual({ owner: 'a', repo: 'b', branch: undefined });
  });
  it('handles trailing slash', () => {
    expect(parseRepoUrl('https://github.com/a/b/')).toEqual({ owner: 'a', repo: 'b', branch: undefined });
  });
  it('handles .git suffix', () => {
    expect(parseRepoUrl('https://github.com/a/b.git')).toEqual({ owner: 'a', repo: 'b', branch: undefined });
  });
  it('handles tree branch paths', () => {
    expect(parseRepoUrl('https://github.com/a/b/tree/main')).toEqual({ owner: 'a', repo: 'b', branch: 'main' });
  });
  it('handles deeply nested branch paths', () => {
    expect(parseRepoUrl('https://github.com/a/b/tree/feature/new-ui')).toEqual({ owner: 'a', repo: 'b', branch: 'feature/new-ui' });
  });
  it('throws on non-github url', () => {
    expect(() => parseRepoUrl('https://gitlab.com/a/b')).toThrow(InvalidUrlError);
  });
  it('throws on missing repo', () => {
    expect(() => parseRepoUrl('https://github.com/a')).toThrow(InvalidUrlError);
  });
  it('throws on empty path', () => {
    expect(() => parseRepoUrl('https://github.com/')).toThrow(InvalidUrlError);
  });
  it('throws on invalid url format', () => {
    expect(() => parseRepoUrl('not-a-url')).toThrow(InvalidUrlError);
  });
});
