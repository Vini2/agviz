import type { ParsedGfa } from './gfaTypes';
import { tagListToObject } from './parseGfa';
import type { AssemblyGraph, AssemblyNode, AssemblyEdge, AssemblyGraphStats } from '../graph/graphTypes';

function getCoverage(tags: Record<string, string>): number | undefined {
  for (const key of ['DP', 'KC', 'RC', 'FC']) {
    if (tags[key] !== undefined) {
      const val = parseFloat(tags[key]);
      if (!isNaN(val)) return val;
    }
  }
  return undefined;
}

function getLength(sequence: string, tags: Record<string, string>): number | undefined {
  if (sequence !== '*') return sequence.length;
  if (tags['LN'] !== undefined) {
    const val = parseInt(tags['LN'], 10);
    if (!isNaN(val)) return val;
  }
  return undefined;
}

export function gfaToGraph(parsed: ParsedGfa): AssemblyGraph {
  const warnings: string[] = [...parsed.warnings];
  const degreeMap = new Map<string, number>();

  const nodes: AssemblyNode[] = parsed.segments.map((seg) => {
    const tags = tagListToObject(seg.tags);
    const length = getLength(seg.sequence, tags);
    const coverage = getCoverage(tags);
    degreeMap.set(seg.name, 0);
    return {
      id: seg.name,
      label: seg.name,
      length,
      sequence: seg.sequence !== '*' ? seg.sequence : undefined,
      coverage,
      tags,
    };
  });

  const edges: AssemblyEdge[] = [];
  const edgeCounts = new Map<string, number>();

  for (const link of parsed.links) {
    const countKey = `${link.from}-${link.to}`;
    const count = (edgeCounts.get(countKey) ?? 0) + 1;
    edgeCounts.set(countKey, count);
    const id = count === 1 ? `${link.from}-${link.to}` : `${link.from}-${link.to}-${count}`;

    if (!degreeMap.has(link.from)) {
      warnings.push(`Link references unknown segment '${link.from}'`);
    }
    if (!degreeMap.has(link.to)) {
      warnings.push(`Link references unknown segment '${link.to}'`);
    }

    degreeMap.set(link.from, (degreeMap.get(link.from) ?? 0) + 1);
    degreeMap.set(link.to, (degreeMap.get(link.to) ?? 0) + 1);

    edges.push({
      id,
      source: link.from,
      target: link.to,
      sourceOrient: link.fromOrient,
      targetOrient: link.toOrient,
      overlap: link.overlap !== '*' ? link.overlap : undefined,
      tags: tagListToObject(link.tags),
    });
  }

  for (const node of nodes) {
    node.degree = degreeMap.get(node.id) ?? 0;
  }

  const totalLength = nodes.reduce((sum, n) => sum + (n.length ?? 0), 0);

  const stats: AssemblyGraphStats = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    totalLength,
  };

  return { nodes, edges, warnings, stats };
}
