import { describe, it, expect } from 'vitest';
import { graphToCytoscape } from './cytoscapeElements';
import type { AssemblyGraph } from './graphTypes';

const sampleGraph: AssemblyGraph = {
  nodes: [
    { id: 'a', label: 'a', length: 100, coverage: 5, degree: 1, tags: {} },
    { id: 'b', label: 'b', length: 200, coverage: 10, degree: 1, tags: {} },
  ],
  edges: [
    {
      id: 'a-b',
      source: 'a',
      target: 'b',
      sourceOrient: '+',
      targetOrient: '+',
      overlap: '10M',
      tags: {},
    },
  ],
  warnings: [],
  stats: { nodeCount: 2, edgeCount: 1, totalLength: 300 },
};

describe('graphToCytoscape', () => {
  it('produces correct number of nodes', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.nodes).toHaveLength(2);
  });

  it('produces correct number of edges', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.edges).toHaveLength(1);
  });

  it('node data includes id and label', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.nodes[0].data.id).toBe('a');
    expect(elements.nodes[0].data['label']).toBe('a');
  });

  it('node data includes length and coverage', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.nodes[0].data['length']).toBe(100);
    expect(elements.nodes[0].data['coverage']).toBe(5);
  });

  it('node size is computed', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(typeof elements.nodes[0].data['size']).toBe('number');
    expect(elements.nodes[0].data['size']).toBeGreaterThan(0);
  });

  it('edge data includes source and target', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.edges[0].data.source).toBe('a');
    expect(elements.edges[0].data.target).toBe('b');
  });

  it('edge data includes orientation and overlap', () => {
    const elements = graphToCytoscape(sampleGraph);
    expect(elements.edges[0].data['sourceOrient']).toBe('+');
    expect(elements.edges[0].data['overlap']).toBe('10M');
  });

  it('handles empty graph', () => {
    const empty: AssemblyGraph = {
      nodes: [],
      edges: [],
      warnings: [],
      stats: { nodeCount: 0, edgeCount: 0, totalLength: 0 },
    };
    const elements = graphToCytoscape(empty);
    expect(elements.nodes).toHaveLength(0);
    expect(elements.edges).toHaveLength(0);
  });
});
