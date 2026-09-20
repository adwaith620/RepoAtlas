export function detectCycles(edges: {sourceId: string, targetId: string}[]) {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    adj.get(e.sourceId)!.push(e.targetId);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]) {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next, [...path, next]);
      } else if (recStack.has(next)) {
        const cycleStart = path.indexOf(next);
        cycles.push(path.slice(cycleStart));
      }
    }
    recStack.delete(node);
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node, [node]);
    }
  }
  return cycles;
}
