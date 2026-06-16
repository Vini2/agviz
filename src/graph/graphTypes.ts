export interface AssemblyNode {
  id: string;
  label: string;
  length?: number;
  sequence?: string;
  coverage?: number;
  tags: Record<string, string>;
  degree?: number;
}

export interface AssemblyEdge {
  id: string;
  source: string;
  target: string;
  sourceOrient?: '+' | '-';
  targetOrient?: '+' | '-';
  overlap?: string;
  tags: Record<string, string>;
  raw?: string;
  reciprocalMemberCount?: number;
  reciprocalMembers?: string[];
  rawLinks?: string[];
}

export interface AssemblyGraphStats {
  nodeCount: number;
  edgeCount: number;
  totalLength: number;
}

export interface AssemblyGraph {
  nodes: AssemblyNode[];
  edges: AssemblyEdge[];
  warnings: string[];
  stats: AssemblyGraphStats;
}
