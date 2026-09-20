export class InvalidUrlError extends Error {
  constructor(message: string = 'Invalid GitHub repository URL') {
    super(message);
    this.name = 'InvalidUrlError';
  }
}

export class RepoNotFoundError extends Error {
  constructor(message: string = 'Repository not found') {
    super(message);
    this.name = 'RepoNotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'GitHub API rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RepoTooLargeError extends Error {
  constructor(message: string = 'Repository is too large to analyze') {
    super(message);
    this.name = 'RepoTooLargeError';
  }
}
