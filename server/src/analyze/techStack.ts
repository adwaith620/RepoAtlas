export function detectTechStack(files: { path: string }[], packageJsonContent?: string) {
  const frameworks: string[] = [];
  const packageManagers: string[] = [];
  const ciTools: string[] = [];
  let docker = false;

  for (const f of files) {
    if (f.path.includes('.github/workflows')) ciTools.push('GitHub Actions');
    if (f.path.includes('.gitlab-ci.yml')) ciTools.push('GitLab CI');
    if (f.path.includes('Dockerfile') || f.path.includes('docker-compose')) docker = true;
    if (f.path === 'package-lock.json') packageManagers.push('npm');
    if (f.path === 'yarn.lock') packageManagers.push('yarn');
    if (f.path === 'pnpm-lock.yaml') packageManagers.push('pnpm');
  }

  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['express']) frameworks.push('Express');
      if (deps['fastify']) frameworks.push('Fastify');
      if (deps['jest']) frameworks.push('Jest');
      if (deps['vitest']) frameworks.push('Vitest');
      if (deps['tailwindcss']) frameworks.push('Tailwind CSS');
    } catch(e) {}
  }

  return {
    frameworks: Array.from(new Set(frameworks)),
    packageManagers: Array.from(new Set(packageManagers)),
    ciTools: Array.from(new Set(ciTools)),
    docker
  };
}
