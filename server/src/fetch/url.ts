import { InvalidUrlError } from './errors.js';

export interface ParsedUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export function parseRepoUrl(url: string): ParsedUrl {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
      throw new InvalidUrlError();
    }
    const path = parsed.pathname.replace(/^\/|\/$/g, '');
    if (!path) throw new InvalidUrlError();

    const parts = path.split('/');
    if (parts.length < 2) throw new InvalidUrlError();

    let owner = parts[0];
    let repo = parts[1];

    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    let branch: string | undefined = undefined;
    if (parts.length >= 4 && parts[2] === 'tree') {
      branch = parts.slice(3).join('/');
    }

    return { owner, repo, branch };
  } catch (err) {
    if (err instanceof InvalidUrlError) throw err;
    throw new InvalidUrlError();
  }
}
