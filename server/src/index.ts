import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { parseRepoUrl } from './fetch/url.js';
import { getRepoMeta, getFileTree, getFileContent } from './fetch/github.js';
import { detectTechStack } from './analyze/techStack.js';
import { parseImports, resolveImport } from './analyze/imports.js';
import { buildGraph } from './graph/build.js';
import { detectCycles } from './graph/cycles.js';
import { clusterByFolder } from './graph/cluster.js';
import { explainRepo, explainFile } from './explain/index.js';
import { cache } from './cache/index.js';

const fastify = Fastify({ logger: true });

async function asyncPool(concurrency: number, items: any[], iteratorFn: (item: any) => Promise<any>) {
  const ret: Promise<any>[] = [];
  const executing = new Set<Promise<any>>();
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

fastify.post('/api/explain/repo', async (request, reply) => {
  try {
    const { url } = request.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'Missing url' });
    const { owner, repo } = parseRepoUrl(url);
    const meta = await getRepoMeta(owner, repo);
    if (!meta) throw new Error("Could not fetch meta");
    const cacheKey = `${owner}/${repo}/${meta.latestCommitSha}`;
    const cachedAnalysis = cache.getRepo(cacheKey);
    let analysis = cachedAnalysis;

    if (!analysis) {
      const result = await getFileTree(owner, repo, meta.latestCommitSha);
      const tree = result?.tree || [];
      const truncated = result?.truncated || false;
      let packageJsonContent = '';
      const fileSet = new Set<string>(tree.map(t => t.path));
      const fileContents = new Map<string, string>();

      await asyncPool(10, tree, async (f) => {
        if (f.type !== 'blob') return;
        if (f.path === 'package.json') {
          packageJsonContent = await getFileContent(owner, repo, f.path, meta.latestCommitSha);
          return;
        }
        const ext = f.path.split('.').pop()?.toLowerCase();
        if (!['js','ts','jsx','tsx','py'].includes(ext!)) return;
        const content = await getFileContent(owner, repo, f.path, meta.latestCommitSha);
        fileContents.set(f.path, content);
      });

      const techStack = detectTechStack(tree, packageJsonContent);
      const edges: any[] = [];
      const externalDeps = new Set<string>();

      for (const [path, content] of fileContents.entries()) {
        const imports = parseImports(path, content);
        for (const imp of imports) {
          const resolved = resolveImport(path, imp.specifier, fileSet);
          if (resolved) {
            edges.push({ sourceId: path, targetId: resolved, type: 'import' });
          } else {
            if (imp.type === 'package') externalDeps.add(imp.specifier);
          }
        }
      }

      let { nodes, edges: finalEdges } = buildGraph(tree, edges);
      nodes = clusterByFolder(nodes);
      const cycles = detectCycles(finalEdges);

      analysis = { meta, techStack, graph: { nodes, edges: finalEdges }, externalDeps: Array.from(externalDeps), cycles, truncated };
      const overview = await explainRepo(analysis);
      analysis.overviewSummary = overview;
      cache.saveRepo(cacheKey, analysis);

      const topFiles = nodes.filter(n => n.data.type === 'file').sort((a, b) => (b.importance || 0) - (a.importance || 0)).slice(0, 30);
      await asyncPool(3, topFiles, async (node) => {
        const path = node.id;
        const cachedExpl = cache.getFile(cacheKey, path);
        if (!cachedExpl) {
          const content = fileContents.get(path) || await getFileContent(owner, repo, path, meta.latestCommitSha);
          const neighbors = {
            in: finalEdges.filter(e => e.targetId === path).map(e => e.sourceId),
            out: finalEdges.filter(e => e.sourceId === path).map(e => e.targetId)
          };
          const explanation = await explainFile(path, content, neighbors);
          cache.saveFile(cacheKey, path, explanation);
        }
      });
    }
    return analysis;
  } catch (err: any) {
    const status = err.name === 'InvalidUrlError' ? 400 : err.name === 'RepoNotFoundError' ? 404 : err.name === 'RateLimitError' ? 429 : 500;
    return reply.status(status).send({ error: err.message || 'Internal Server Error' });
  }
});

fastify.post('/api/explain/file', async (request, reply) => {
  try {
    const { url, path } = request.body as { url: string, path: string };
    if (!url || !path) return reply.status(400).send({ error: 'Missing url or path' });
    const { owner, repo } = parseRepoUrl(url);
    const meta = await getRepoMeta(owner, repo);
    if (!meta) throw new Error("Could not fetch meta");
    const cacheKey = `${owner}/${repo}/${meta.latestCommitSha}`;
    const cachedExpl = cache.getFile(cacheKey, path);
    if (cachedExpl) return { explanation: cachedExpl };

    const analysis = cache.getRepo(cacheKey);
    let neighbors = { in: [] as string[], out: [] as string[] };
    if (analysis) {
      neighbors.in = analysis.graph.edges.filter((e: any) => e.targetId === path).map((e: any) => e.sourceId);
      neighbors.out = analysis.graph.edges.filter((e: any) => e.sourceId === path).map((e: any) => e.targetId);
    }

    const content = await getFileContent(owner, repo, path, meta.latestCommitSha);
    const explanation = await explainFile(path, content, neighbors);
    cache.saveFile(cacheKey, path, explanation);
    return { explanation };
  } catch (err: any) {
    const status = err.name === 'InvalidUrlError' ? 400 : err.name === 'RepoNotFoundError' ? 404 : err.name === 'RateLimitError' ? 429 : 500;
    return reply.status(status).send({ error: err.message || 'Internal Server Error' });
  }
});

const webDist = path.join(__dirname, '../../web/dist');
fastify.register(fastifyStatic, {
  root: webDist,
  prefix: '/',
  wildcard: false,
});

fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    reply.status(404).send({ error: 'Not found' });
  } else {
    reply.sendFile('index.html', webDist);
  }
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
