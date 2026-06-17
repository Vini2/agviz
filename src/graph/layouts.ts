import type cytoscape from 'cytoscape';
import type { AssemblyGraph } from './graphTypes';
import { endpointId, mapLinkEndpoints, type EndpointSide } from './cytoscapeElements';
import { contigVisualLength, type LengthScaleConfig } from './visualScale';

export type LayoutName =
  | 'fcose'
  | 'bandage'
  | 'cose'
  | 'breadthfirst'
  | 'circle'
  | 'concentric'
  | 'grid';

export const LAYOUT_NAMES: LayoutName[] = [
  'fcose',
  'bandage',
  'circle',
  'concentric',
  'cose',
  'breadthfirst',
  'grid',
];

export const LARGE_GRAPH_NODE_THRESHOLD = 5000;
export const LARGE_GRAPH_EDGE_THRESHOLD = 10000;
const DEFAULT_LAYOUT_PADDING = 35;
const BANDAGE_LAYOUT_PADDING = 70;
const FCOSE_IDEAL_EDGE_LENGTH = 24;
const CONTIG_FCOSE_NODE_REPULSION = 4500;
const CONTIG_FCOSE_GRAVITY = 0.45;
const CONTIG_FCOSE_NUM_ITERATIONS = 2500;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const BANDAGE_COMPONENT_GAP = 180;
const BANDAGE_LINK_FAN_RADIUS = 18;
const BANDAGE_LENGTH_SCALE: LengthScaleConfig = {
  pixelsPerBase: 0.035,
  minVisualLengthPx: 22,
  maxVisualLengthPx: 280,
};

interface Point {
  x: number;
  y: number;
}

interface SegmentJunction {
  segmentId: string;
  leftRoot: string;
  rightRoot: string;
  visualLength: number;
}

export function chooseDefaultLayout(graph: AssemblyGraph): LayoutName {
  if (graph.nodes.length <= 12 && graph.edges.length >= graph.nodes.length) {
    return 'circle';
  }

  return 'fcose';
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

class DisjointSet {
  private parent = new Map<string, string>();

  add(id: string): void {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
    }
  }

  find(id: string): string {
    this.add(id);
    const parent = this.parent.get(id) ?? id;
    if (parent === id) {
      return id;
    }
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    const [first, second] = [rootA, rootB].sort();
    this.parent.set(second, first);
  }
}

function componentLevels(component: string[], adjacency: Map<string, Set<string>>): Map<string, number> {
  const componentSet = new Set(component);
  const hub = component
    .slice()
    .sort((a, b) => {
      const degreeDelta = (adjacency.get(b)?.size ?? 0) - (adjacency.get(a)?.size ?? 0);
      return degreeDelta || a.localeCompare(b);
    })[0];

  const levels = new Map<string, number>([[hub, 0]]);
  const queue = [hub];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor];
    const level = levels.get(id) ?? 0;
    for (const next of [...(adjacency.get(id) ?? [])].sort()) {
      if (!componentSet.has(next) || levels.has(next)) continue;
      levels.set(next, level + 1);
      queue.push(next);
    }
  }

  for (const id of component) {
    if (!levels.has(id)) {
      levels.set(id, 1);
    }
  }

  return levels;
}

function bounds(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

function offsetPositions(
  positions: Record<string, Point>,
  dx: number,
  dy: number,
): Record<string, Point> {
  return Object.fromEntries(
    Object.entries(positions).map(([id, point]) => [id, { x: point.x + dx, y: point.y + dy }]),
  );
}

function sideDirection(side: EndpointSide): -1 | 1 {
  return side === 'left' ? -1 : 1;
}

function addSegmentEndpointPositions(
  positions: Record<string, Point>,
  segmentId: string,
  centre: Point,
  angle: number,
  length: number,
): void {
  const halfLength = length / 2;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  for (const side of ['left', 'right'] as const) {
    const direction = sideDirection(side);
    positions[endpointId(segmentId, side)] = {
      x: centre.x + ux * halfLength * direction,
      y: centre.y + uy * halfLength * direction,
    };
  }
}

function buildSegmentJunctions(graph: AssemblyGraph): SegmentJunction[] {
  const disjointSet = new DisjointSet();
  const nodeIds = new Set(graph.nodes.map((node) => node.id));

  for (const node of graph.nodes) {
    disjointSet.add(endpointId(node.id, 'left'));
    disjointSet.add(endpointId(node.id, 'right'));
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (edge.source === edge.target) continue;

    const { sourceEndpointId, targetEndpointId } = mapLinkEndpoints(
      edge.source,
      edge.sourceOrient,
      edge.target,
      edge.targetOrient,
    );
    disjointSet.union(sourceEndpointId, targetEndpointId);
  }

  return graph.nodes.map((node) => ({
    segmentId: node.id,
    leftRoot: disjointSet.find(endpointId(node.id, 'left')),
    rightRoot: disjointSet.find(endpointId(node.id, 'right')),
    visualLength: contigVisualLength(node.length, BANDAGE_LENGTH_SCALE),
  }));
}

function buildJunctionAdjacency(segments: SegmentJunction[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  const addRoot = (root: string) => {
    if (!adjacency.has(root)) {
      adjacency.set(root, new Set());
    }
  };

  for (const segment of segments) {
    addRoot(segment.leftRoot);
    addRoot(segment.rightRoot);
    if (segment.leftRoot === segment.rightRoot) continue;

    adjacency.get(segment.leftRoot)!.add(segment.rightRoot);
    adjacency.get(segment.rightRoot)!.add(segment.leftRoot);
  }

  return adjacency;
}

function junctionComponents(adjacency: Map<string, Set<string>>): string[][] {
  const remaining = new Set(adjacency.keys());
  const components: string[][] = [];

  while (remaining.size > 0) {
    const start = [...remaining].sort()[0];
    const queue = [start];
    const component: string[] = [];
    remaining.delete(start);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const id = queue[cursor];
      component.push(id);

      for (const next of [...(adjacency.get(id) ?? [])].sort()) {
        if (!remaining.has(next)) continue;
        remaining.delete(next);
        queue.push(next);
      }
    }

    components.push(component);
  }

  return components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

function singleSegmentForComponent(
  component: string[],
  segments: SegmentJunction[],
): SegmentJunction | undefined {
  const componentSet = new Set(component);
  const componentSegments = segments.filter(
    (segment) => componentSet.has(segment.leftRoot) && componentSet.has(segment.rightRoot),
  );

  return componentSegments.length === 1 ? componentSegments[0] : undefined;
}

function junctionPositionsForComponent(
  component: string[],
  adjacency: Map<string, Set<string>>,
  segments: SegmentJunction[],
): Record<string, Point> {
  const singleSegment = singleSegmentForComponent(component, segments);
  if (singleSegment && singleSegment.leftRoot !== singleSegment.rightRoot) {
    const angle = (stableHash(singleSegment.segmentId) / 0xffffffff) * Math.PI * 2;
    const positions: Record<string, Point> = {};
    addSegmentEndpointPositions(
      positions,
      singleSegment.segmentId,
      { x: 0, y: 0 },
      angle,
      singleSegment.visualLength,
    );
    return {
      [singleSegment.leftRoot]: positions[endpointId(singleSegment.segmentId, 'left')],
      [singleSegment.rightRoot]: positions[endpointId(singleSegment.segmentId, 'right')],
    };
  }

  const levels = componentLevels(component, adjacency);
  const ordered = component
    .slice()
    .sort((a, b) => (levels.get(a) ?? 0) - (levels.get(b) ?? 0) || a.localeCompare(b));
  const positions: Record<string, Point> = {};
  const seed = stableHash(component.join('|')) / 0xffffffff;
  const baseAngle = seed * Math.PI * 2;
  const spread = Math.max(125, Math.sqrt(component.length) * 54);

  ordered.forEach((junctionId, index) => {
    const level = levels.get(junctionId) ?? 0;
    const angle = baseAngle + index * GOLDEN_ANGLE;
    const radius = index === 0 ? 0 : 125 + level * 88 + Math.sqrt(index) * spread;
    positions[junctionId] = {
      x: Math.cos(angle) * radius * 1.55,
      y: Math.sin(angle) * radius * 0.92,
    };
  });

  return positions;
}

function endpointsByJunction(segments: SegmentJunction[]): Map<string, string[]> {
  const endpoints = new Map<string, string[]>();
  const addEndpoint = (root: string, id: string) => {
    const existing = endpoints.get(root) ?? [];
    existing.push(id);
    endpoints.set(root, existing);
  };

  for (const segment of segments) {
    addEndpoint(segment.leftRoot, endpointId(segment.segmentId, 'left'));
    addEndpoint(segment.rightRoot, endpointId(segment.segmentId, 'right'));
  }

  for (const ids of endpoints.values()) {
    ids.sort();
  }

  return endpoints;
}

function fanEndpointFromJunction(junction: Point, root: string, endpoint: string, endpoints: string[]): Point {
  if (endpoints.length < 2) {
    return junction;
  }

  const index = endpoints.indexOf(endpoint);
  const safeIndex = index === -1 ? 0 : index;
  const baseAngle = (stableHash(root) / 0xffffffff) * Math.PI * 2;
  const angle = baseAngle + (safeIndex / endpoints.length) * Math.PI * 2;

  return {
    x: junction.x + Math.cos(angle) * BANDAGE_LINK_FAN_RADIUS,
    y: junction.y + Math.sin(angle) * BANDAGE_LINK_FAN_RADIUS,
  };
}

export function bandageEndpointPositions(graph: AssemblyGraph): Record<string, Point> {
  if (graph.nodes.length === 0) {
    return {};
  }

  const segments = buildSegmentJunctions(graph);
  const adjacency = buildJunctionAdjacency(segments);
  const components = junctionComponents(adjacency);
  const packedJunctionPositions: Record<string, Point> = {};
  let cursorX = 0;

  for (const component of components) {
    const componentPositions = junctionPositionsForComponent(component, adjacency, segments);
    const componentBounds = bounds(Object.values(componentPositions));
    const width = componentBounds.maxX - componentBounds.minX;
    const dx = cursorX - componentBounds.minX;
    const dy = -((componentBounds.minY + componentBounds.maxY) / 2);
    Object.assign(packedJunctionPositions, offsetPositions(componentPositions, dx, dy));
    cursorX += width + BANDAGE_COMPONENT_GAP;
  }

  const packedBounds = bounds(Object.values(packedJunctionPositions));
  const centredJunctionPositions = offsetPositions(
    packedJunctionPositions,
    -((packedBounds.minX + packedBounds.maxX) / 2),
    -((packedBounds.minY + packedBounds.maxY) / 2),
  );

  const endpointPositions: Record<string, Point> = {};
  const junctionEndpoints = endpointsByJunction(segments);

  for (const segment of segments) {
    const left = centredJunctionPositions[segment.leftRoot];
    const right = centredJunctionPositions[segment.rightRoot];
    const leftEndpoint = endpointId(segment.segmentId, 'left');
    const rightEndpoint = endpointId(segment.segmentId, 'right');

    if (left && right && segment.leftRoot !== segment.rightRoot) {
      endpointPositions[leftEndpoint] = fanEndpointFromJunction(
        left,
        segment.leftRoot,
        leftEndpoint,
        junctionEndpoints.get(segment.leftRoot) ?? [],
      );
      endpointPositions[rightEndpoint] = fanEndpointFromJunction(
        right,
        segment.rightRoot,
        rightEndpoint,
        junctionEndpoints.get(segment.rightRoot) ?? [],
      );
      continue;
    }

    const centre = left ?? right ?? { x: 0, y: 0 };
    const angle = (stableHash(segment.segmentId) / 0xffffffff) * Math.PI * 2;
    addSegmentEndpointPositions(
      endpointPositions,
      segment.segmentId,
      centre,
      angle,
      segment.visualLength,
    );
  }

  return endpointPositions;
}

export function getLayoutOptions(
  name: LayoutName,
  graph?: AssemblyGraph,
): cytoscape.LayoutOptions {
  switch (name) {
    case 'bandage': {
      const positions = graph ? bandageEndpointPositions(graph) : {};

      return {
        name: 'preset',
        animate: false,
        fit: true,
        padding: BANDAGE_LAYOUT_PADDING,
        positions: (node: cytoscape.NodeSingular) => positions[String(node.data('id'))],
      } as cytoscape.LayoutOptions;
    }
    case 'fcose':
      return {
        name: 'fcose',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
        nodeDimensionsIncludeLabels: false,
        idealEdgeLength: FCOSE_IDEAL_EDGE_LENGTH,
        nodeRepulsion: CONTIG_FCOSE_NODE_REPULSION,
        gravity: CONTIG_FCOSE_GRAVITY,
        gravityRangeCompound: 1.5,
        gravityCompound: 1.0,
        numIter: CONTIG_FCOSE_NUM_ITERATIONS,
        randomize: true,
      } as cytoscape.LayoutOptions;
    case 'cose':
      return {
        name: 'cose',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
        nodeDimensionsIncludeLabels: false,
      } as cytoscape.LayoutOptions;
    case 'circle':
      return {
        name: 'circle',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false,
      } as cytoscape.LayoutOptions;
    case 'concentric':
      return {
        name: 'concentric',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false,
        concentric: (node: cytoscape.NodeSingular) => node.degree(),
        levelWidth: () => 2,
      } as cytoscape.LayoutOptions;
    case 'breadthfirst':
      return {
        name: 'breadthfirst',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
        directed: false,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false,
      } as cytoscape.LayoutOptions;
    case 'grid':
      return {
        name: 'grid',
        animate: false,
        fit: true,
        padding: DEFAULT_LAYOUT_PADDING,
      } as cytoscape.LayoutOptions;
  }
}
