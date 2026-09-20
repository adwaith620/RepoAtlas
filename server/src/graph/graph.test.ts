import { describe, it, expect } from 'vitest';
import { buildGraph } from './build.js';
import { detectCycles } from './cycles.js';
import { clusterByFolder } from './cluster.js';

describe('Graph building', () => {
  it('computes degrees and importance', () => {
    const files = [{ path: 'a.js', type: 'blob' }, { path: 'b.js', type: 'blob' }];
    const edges = [{ sourceId: 'a.js', targetId: 'b.js', type: 'import' }];
    const { nodes } = buildGraph(files, edges);

    const nodeA = nodes.find(n => n.id === 'a.js')!;
    const nodeB = nodes.find(n => n.id === 'b.js')!;

    expect(nodeA.outDegree).toBe(1);
    expect(nodeA.inDegree).toBe(0);
    expect(nodeA.importance).toBe(0.5); 

    expect(nodeB.inDegree).toBe(1);
    expect(nodeB.outDegree).toBe(0);
    expect(nodeB.importance).toBe(1); 
  });
});

describe('detectCycles', () => {
  it('detects a simple cycle', () => {
    const edges = [
      { sourceId: 'a', targetId: 'b' },
      { sourceId: 'b', targetId: 'c' },
      { sourceId: 'c', targetId: 'a' },
      { sourceId: 'a', targetId: 'd' }
    ];
    const cycles = detectCycles(edges);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('a');
    expect(cycles[0]).toContain('b');
    expect(cycles[0]).toContain('c');
  });
});

describe('clusterByFolder', () => {
  it('creates directory nodes', () => {
    const nodes = [
      { id: 'src/a.js', data: { type: 'file' } },
      { id: 'src/utils/b.js', data: { type: 'file' } }
    ];
    const clustered = clusterByFolder(nodes);
    expect(clustered.find(n => n.id === 'src')).toBeDefined();
    expect(clustered.find(n => n.id === 'src/utils')).toBeDefined();
  });
});
