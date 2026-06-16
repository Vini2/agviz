import { describe, it, expect } from 'vitest';
import { gfaToGraph } from './gfaToGraph';
import { parseGfa } from './parseGfa';

const TINY_GFA = `H\tVN:Z:1.0
S\tcontig1\tACGTACGT\tLN:i:8\tDP:f:12.4
S\tcontig2\tGGTTGGTT\tLN:i:8\tDP:f:8.1
L\tcontig1\t+\tcontig2\t-\t4M
`;

const STAR_SEQ_GFA = `H\tVN:Z:1.0
S\tA\t*\tLN:i:1000\tDP:f:20
S\tB\t*\tLN:i:1500\tDP:f:15
L\tA\t+\tB\t+\t100M
`;

describe('gfaToGraph – tiny GFA', () => {
  it('produces two nodes', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.nodes).toHaveLength(2);
  });

  it('produces one edge', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.edges).toHaveLength(1);
  });

  it('node ids match segment names', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.nodes.map((n) => n.id)).toEqual(['contig1', 'contig2']);
  });

  it('node has correct length from sequence', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.nodes[0].length).toBe(8);
  });

  it('node has coverage from DP tag', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.nodes[0].coverage).toBeCloseTo(12.4);
  });

  it('node has degree set', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.nodes[0].degree).toBe(1);
    expect(graph.nodes[1].degree).toBe(1);
  });

  it('edge has correct source and target', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    const edge = graph.edges[0];
    expect(edge.source).toBe('contig1');
    expect(edge.target).toBe('contig2');
  });

  it('edge has correct orientations', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    const edge = graph.edges[0];
    expect(edge.sourceOrient).toBe('+');
    expect(edge.targetOrient).toBe('-');
  });

  it('edge has overlap', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.edges[0].overlap).toBe('4M');
  });

  it('stats are correct', () => {
    const graph = gfaToGraph(parseGfa(TINY_GFA));
    expect(graph.stats.nodeCount).toBe(2);
    expect(graph.stats.edgeCount).toBe(1);
    expect(graph.stats.totalLength).toBe(16);
  });
});

describe('gfaToGraph – star sequence with LN tag', () => {
  it('uses LN tag for length when sequence is *', () => {
    const graph = gfaToGraph(parseGfa(STAR_SEQ_GFA));
    expect(graph.nodes[0].length).toBe(1000);
    expect(graph.nodes[1].length).toBe(1500);
  });

  it('does not set sequence when * is used', () => {
    const graph = gfaToGraph(parseGfa(STAR_SEQ_GFA));
    expect(graph.nodes[0].sequence).toBeUndefined();
  });

  it('total length uses LN tags', () => {
    const graph = gfaToGraph(parseGfa(STAR_SEQ_GFA));
    expect(graph.stats.totalLength).toBe(2500);
  });
});

describe('gfaToGraph – coverage tag priority', () => {
  it('uses KC tag when DP is absent', () => {
    const gfa = 'S\tnode1\t*\tLN:i:100\tKC:i:50\n';
    const graph = gfaToGraph(parseGfa(gfa));
    expect(graph.nodes[0].coverage).toBe(50);
  });

  it('returns undefined when no coverage tag present', () => {
    const gfa = 'S\tnode1\tACGT\n';
    const graph = gfaToGraph(parseGfa(gfa));
    expect(graph.nodes[0].coverage).toBeUndefined();
  });
});

describe('gfaToGraph – warnings for unknown segments in links', () => {
  it('warns when link references missing segment', () => {
    const gfa = 'S\ta\tACGT\nL\ta\t+\tMISSING\t+\t*\n';
    const graph = gfaToGraph(parseGfa(gfa));
    expect(graph.warnings.some((w) => w.includes('MISSING'))).toBe(true);
  });
});
