export function clusterByFolder(nodes: any[]) {
  const dirs = new Set<string>();

  for (const n of nodes) {
    if (n.data.type === 'file') {
      const parts = n.id.split('/');
      if (parts.length > 1) {
        let curr = '';
        for (let i=0; i<parts.length-1; i++) {
          curr += (curr ? '/' : '') + parts[i];
          dirs.add(curr);
        }
        n.parentId = parts.slice(0, -1).join('/');
      }
    }
  }

  for (const d of dirs) {
    if (!nodes.find(x => x.id === d)) {
      const parts = d.split('/');
      const parentId = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;
      nodes.push({
        id: d,
        data: { id: d, path: d, type: 'directory' },
        parentId,
        inDegree: 0,
        outDegree: 0,
        importance: 0
      });
    }
  }

  return nodes;
}
