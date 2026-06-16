import type { AssemblyGraph } from './graphTypes';
import type cytoscape from 'cytoscape';
import { contigVisualWidth, contigVisualHeight } from './visualScale';

export interface CytoscapeElements {
  nodes: cytoscape.NodeDefinition[];
  edges: cytoscape.EdgeDefinition[];
}

export function graphToCytoscape(graph: AssemblyGraph): CytoscapeElements {
  const nodes: cytoscape.NodeDefinition[] = graph.nodes.map((node) => ({
    data: {
      id: node.id,
      label: node.label ?? node.id,
      length: node.length,
      sequence: node.sequence,
      coverage: node.coverage,
      degree: node.degree,
      tags: node.tags,
      width: contigVisualWidth(node.length),
      height: contigVisualHeight(node.length),
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
