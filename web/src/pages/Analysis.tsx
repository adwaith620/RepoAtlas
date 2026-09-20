import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Download, FileText } from 'lucide-react';

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    const size = node.data.type === 'directory' ? 120 : 80 + (node.data.importance || 0) * 10;
    dagreGraph.setNode(node.id, { width: size, height: size / 2 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === 'LR' ? 'left' : 'top',
      sourcePosition: direction === 'LR' ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
      style: { 
        width: nodeWithPosition.width, 
        height: nodeWithPosition.height,
        background: node.data.type === 'directory' ? '#334155' : '#1e293b',
        color: 'white',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        border: '1px solid #475569',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function Analysis() {
  const { owner, repo } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<any>({});
  
  const flowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRepo = async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch('/api/explain/repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://github.com/${owner}/${repo}` })
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to analyze');
        
        setData(resData);
        
        const cycleSet = new Set(resData.cycles?.flat() || []);
        
        const rfNodes = resData.graph.nodes.map((n: any) => ({
          id: n.id,
          data: { label: n.id.split('/').pop(), type: n.data.type, importance: n.importance },
          position: { x: 0, y: 0 }
        }));
        
        const rfEdges = resData.graph.edges.map((e: any) => {
          const isCycle = cycleSet.has(e.sourceId) && cycleSet.has(e.targetId);
          return {
            id: `${e.sourceId}-${e.targetId}`,
            source: e.sourceId,
            target: e.targetId,
            animated: true,
            style: { stroke: isCycle ? '#ef4444' : '#64748b', strokeWidth: isCycle ? 2 : 1 }
          };
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges, 'LR');
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
      } catch(e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRepo();
  }, [owner, repo, setNodes, setEdges]);

  useEffect(() => {
    if (!selectedNode || !data) return;
    const nodeData = data.graph.nodes.find((n: any) => n.id === selectedNode);
    if (nodeData?.data.type !== 'file') return;
    
    if (fileDetails[selectedNode]) return; // already loaded

    const fetchFileExpl = async () => {
      try {
        const res = await fetch('/api/explain/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://github.com/${owner}/${repo}`, path: selectedNode })
        });
        const explData = await res.json();
        if (res.ok) {
          setFileDetails((prev: any) => ({...prev, [selectedNode]: explData.explanation}));
        }
      } catch (e) { console.error(e); }
    };
    fetchFileExpl();
  }, [selectedNode, data, owner, repo, fileDetails]);

  const exportMarkdown = () => {
    if (!data) return;
    const md = `# ${owner}/${repo}\n\n## Overview\n${data.overviewSummary}\n\n## Tech Stack\n- Frameworks: ${data.techStack.frameworks.join(', ')}\n- Package Managers: ${data.techStack.packageManagers.join(', ')}\n- CI: ${data.techStack.ciTools.join(', ')}`;
    const blob = new Blob([md], {type: 'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${repo}-summary.md`;
    a.click();
  };

  const exportPng = () => {
    if (flowRef.current === null) return;
    toPng(flowRef.current, { filter: (node) => !(node?.classList?.contains('react-flow__minimap') || node?.classList?.contains('react-flow__controls')) })
      .then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${repo}-graph.png`;
        a.click();
      });
  };

  if (loading) return <div className="p-8">Analyzing repository... (this may take a minute)</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 dark:bg-gray-800 p-4 flex gap-4 justify-between items-center border-b dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold">{owner}/{repo}</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
            <span>{data.graph.nodes.length} nodes</span>
            <span>{data.graph.edges.length} edges</span>
            <span>{data.cycles.length} cycles</span>
            {data.truncated && <span className="text-yellow-600 font-bold ml-2">⚠️ Truncated</span>}
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={exportMarkdown} className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1 rounded shadow-sm text-sm"><FileText size={16}/> Summary</button>
           <button onClick={exportPng} className="flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1 rounded shadow-sm text-sm"><Download size={16}/> Graph Image</button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 border-r dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="font-bold mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-1 mb-6">
             {data.techStack.frameworks.map((f: string) => <span key={f} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">{f}</span>)}
             {data.techStack.ciTools.map((c: string) => <span key={c} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">{c}</span>)}
          </div>
          
          <h3 className="font-bold mb-2">Overview</h3>
          <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{data.overviewSummary}</p>
        </div>
        
        {/* Center Panel - Graph */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative" ref={flowRef}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNode(node.id)}
            fitView
          >
            <Controls />
            <MiniMap nodeStrokeColor="#475569" nodeColor="#1e293b" maskColor="rgba(0,0,0,0.2)" />
            <Background color="#94a3b8" gap={16} />
          </ReactFlow>
        </div>
        
        {/* Right Panel - Details */}
        <div className="w-80 border-l dark:border-gray-700 p-4 overflow-y-auto bg-white dark:bg-gray-950">
          {selectedNode ? (
            <div>
              <h3 className="font-bold mb-4 break-all">{selectedNode}</h3>
              {fileDetails[selectedNode] ? (
                 <div className="text-sm mb-4 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                   {fileDetails[selectedNode]}
                 </div>
              ) : (
                 <div className="text-sm mb-4 animate-pulse">Loading AI explanation...</div>
              )}
              <h4 className="font-semibold text-sm mb-1 mt-4">Imports:</h4>
              <ul className="text-xs list-disc pl-4 mb-4 break-all">
                {data.graph.edges.filter((e: any) => e.sourceId === selectedNode).map((e: any) => <li key={e.targetId}>{e.targetId}</li>)}
              </ul>
              <h4 className="font-semibold text-sm mb-1">Imported by:</h4>
              <ul className="text-xs list-disc pl-4 break-all">
                {data.graph.edges.filter((e: any) => e.targetId === selectedNode).map((e: any) => <li key={e.sourceId}>{e.sourceId}</li>)}
              </ul>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Click a node to see details</div>
          )}
        </div>
      </div>
    </div>
  );
}
