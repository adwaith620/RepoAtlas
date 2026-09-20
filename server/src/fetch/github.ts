import { Octokit } from 'octokit';
import { RateLimitError, RepoNotFoundError } from './errors.js';

let octokitInstance: Octokit | null = null;
export const getOctokit = () => {
  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return octokitInstance;
};

export const handleGithubError = (err: any) => {
  if (err.status === 404) throw new RepoNotFoundError();
  if (err.status === 403 || err.status === 429) throw new RateLimitError();
  throw err;
};

export async function getRepoMeta(owner: string, repo: string) {
  try {
    const octokit = getOctokit();
    const [{ data: repoData }, { data: langs }] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listLanguages({ owner, repo })
    ]);

    const branch = repoData.default_branch;
    const { data: branchData } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch
    });

    return {
      defaultBranch: branch,
      description: repoData.description,
      stars: repoData.stargazers_count,
      languages: langs,
      latestCommitSha: branchData.commit.sha
    };
  } catch (err) {
    handleGithubError(err);
  }
}

export function filterAndSortTree(files: any[]) {
  const skipDirs = ['node_modules', 'dist', 'build', 'vendor', '.git'];
  const skipExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.pdf'];
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Gemfile.lock', 'poetry.lock'];

  let filtered = files.filter(f => {
    if (f.type !== 'blob') return false;
    if (f.size && f.size > 200 * 1024) return false;

    const path = f.path;
    const parts = path.split('/');
    const filename = parts[parts.length - 1];

    if (skipDirs.some(dir => parts.includes(dir))) return false;
    if (lockFiles.includes(filename)) return false;
    if (skipExts.some(ext => path.toLowerCase().endsWith(ext))) return false;
    if (filename.endsWith('.min.js') || filename.endsWith('.min.css')) return false;

    return true;
  });

  const getPriority = (path: string) => {
    if (path.startsWith('src/') || path.startsWith('lib/') || path.startsWith('app/') || path.startsWith('packages/')) {
      return 1;
    }
    return 0;
  };

  filtered.sort((a, b) => {
    const pA = getPriority(a.path);
    const pB = getPriority(b.path);
    if (pA !== pB) return pB - pA;
    return a.path.localeCompare(b.path);
  });

  const MAX_FILES = 400;
  const truncated = filtered.length > MAX_FILES;
  if (truncated) {
    filtered = filtered.slice(0, MAX_FILES);
  }

  return { tree: filtered, truncated };
}

export async function getFileTree(owner: string, repo: string, sha: string) {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: "1"
    });

    return filterAndSortTree(data.tree);
  } catch (err) {
    handleGithubError(err);
  }
}

export async function getFileContent(owner: string, repo: string, path: string, sha: string, attempt = 1): Promise<string> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: sha
    });
    
    if (Array.isArray(data) || data.type !== 'file' || !data.content) {
      throw new Error('Not a file');
    }
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (err: any) {
    if ((err.status === 403 || err.status === 429) && attempt <= 2) {
       await new Promise(r => setTimeout(r, 1000 * attempt));
       return getFileContent(owner, repo, path, sha, attempt + 1);
    }
    handleGithubError(err);
    return "";
  }
}
