export interface RepoRef {
  owner: string;
  repo: string;
  branch?: string;
  commitSha?: string;
}

export interface FileNode {
  id: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  summary?: string;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  type: string;
}

export interface GraphNode {
  id: string;
  data: FileNode;
  parentId?: string;
  inDegree?: number;
  outDegree?: number;
  importance?: number;
}

export interface TechStackInfo {
  frameworks: string[];
  packageManagers: string[];
  ciTools: string[];
  docker: boolean;
}

export interface AnalysisResult {
  meta: any;
  techStack: TechStackInfo;
  graph: { nodes: GraphNode[]; edges: DependencyEdge[] };
  externalDeps: string[];
  cycles: string[][];
  truncated: boolean;
  overviewSummary?: string;
  onboardingGuide?: string;
}
