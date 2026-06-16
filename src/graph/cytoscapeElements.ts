import type { AssemblyGraph } from './graphTypes';
import type cytoscape from 'cytoscape';

export interface CytoscapeElements {
  nodes: cytoscape.NodeDefinition[];
  edges: cytoscape.EdgeDefinition[];
}

function nodeSize(length: number | undefined): number {
  if (!length || length <= 0) return 20;
  return Math.max(20, Math.min(80, 10 + Math.log10(length) * 15));
}

export function graphToCytoscape(graph: AssemblyGraph): CytoscapeElements {
  const nodes: cytoscape.NodeDefinition[] = graph.nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.label,
      length: node.length,
      sequence: node.sequence,
      coverage: node.coverage,
      degree: node.degree,
      tags: node.tags,
      size: nodeSize(node.length),
    },
  }));

  const edges: cytoscape.EdgeDefinition[] = graph.edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceOrient: edge.sourceOrient,
      targetOrient: edge.targetOrient,
      overlap: edge.overlap,
      tags: edge.tags,
    },
  }));

  return { nodes, edges };
}
