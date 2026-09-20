export function buildGraph(files: any[], edges: {sourceId: string, targetId: string, type: string}[]) {
  const nodes: any[] = [];
  const nodeMap = new Map();

  for (const f of files) {
    const n = {
      id: f.path,
      data: { id: f.path, path: f.path, type: 'file' },
      inDegree: 0,
      outDegree: 0,
      importance: 0
    };
    nodes.push(n);
    nodeMap.set(f.path, n);
  }

  for (const e of edges) {
    if (nodeMap.has(e.sourceId)) nodeMap.get(e.sourceId).outDegree++;
    if (nodeMap.has(e.targetId)) nodeMap.get(e.targetId).inDegree++;
  }

  for (const n of nodes) {
    n.importance = n.inDegree + (n.outDegree * 0.5);
  }

  return { nodes, edges };
}
