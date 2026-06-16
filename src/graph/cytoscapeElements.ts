import type { AssemblyGraph } from './graphTypes';
import type cytoscape from 'cytoscape';
import {
  contigVisualLength,
  contigVisualThickness,
  DEFAULT_LENGTH_SCALE,
  type LengthScaleConfig,
} from './visualScale';
import {
  coverageMinMax,
  coverageToColor,
  defaultContigColor,
  type ThemeMode,
} from './coverageColors';

export interface CytoscapeElements {
  nodes: cytoscape.NodeDefinition[];
  edges: cytoscape.EdgeDefinition[];
}

export interface CytoscapeGraphOptions {
  themeMode?: ThemeMode;
  colorByCoverage?: boolean;
  lengthScale?: LengthScaleConfig;
}

export type EndpointSide = 'left' | 'right';

export function endpointId(segmentId: string, side: EndpointSide): string {
  return `${segmentId}::__${side}`;
}

function sourceSideFromOrientation(sourceOrient: '+' | '-' | undefined): EndpointSide {
  return sourceOrient === '-' ? 'left' : 'right';
}

function targetSideFromOrientation(targetOrient: '+' | '-' | undefined): EndpointSide {
  return targetOrient === '-' ? 'right' : 'left';
}

export function mapLinkEndpoints(
  sourceSegment: string,
  sourceOrient: '+' | '-' | undefined,
  targetSegment: string,
  targetOrient: '+' | '-' | undefined,
): { sourceEndpointId: string; targetEndpointId: string } {
  return {
    sourceEndpointId: endpointId(sourceSegment, sourceSideFromOrientation(sourceOrient)),
    targetEndpointId: endpointId(targetSegment, targetSideFromOrientation(targetOrient)),
  };
}

export function graphToCytoscape(
  graph: AssemblyGraph,
  options: CytoscapeGraphOptions = {},
): CytoscapeElements {
  const themeMode = options.themeMode ?? 'light';
  const colorByCoverage = options.colorByCoverage ?? false;
  const lengthScale = options.lengthScale ?? DEFAULT_LENGTH_SCALE;

  const { minCoverage, maxCoverage } = coverageMinMax(graph.nodes.map((node) => node.coverage));

  const nodes: cytoscape.NodeDefinition[] = graph.nodes.flatMap((node) => [
    {
      data: {
        id: endpointId(node.id, 'left'),
        kind: 'endpoint',
        segmentId: node.id,
        side: 'left',
      },
      classes: 'endpoint',
    },
    {
      data: {
        id: endpointId(node.id, 'right'),
        kind: 'endpoint',
        segmentId: node.id,
        side: 'right',
      },
      classes: 'endpoint',
    },
  ]);

  const bodyEdges: cytoscape.EdgeDefinition[] = graph.nodes.map((node) => {
    const visualLength = contigVisualLength(node.length, lengthScale);
    const thickness = contigVisualThickness();

    return {
      data: {
        id: `body::${node.id}`,
        source: endpointId(node.id, 'left'),
        target: endpointId(node.id, 'right'),
        kind: 'contig-body',
        segmentId: node.id,
        label: node.label ?? node.id,
        lengthBp: node.length,
        sequence: node.sequence,
        coverage: node.coverage,
        degree: node.degree,
        tags: node.tags,
        visualLength,
        thickness,
        color: colorByCoverage
          ? coverageToColor(node.coverage, minCoverage, maxCoverage, themeMode)
          : defaultContigColor(themeMode),
      },
      classes: 'contig-body',
    };
  });

  const linkEdges: cytoscape.EdgeDefinition[] = graph.edges.map((edge, index) => {
    const mapped = mapLinkEndpoints(edge.source, edge.sourceOrient, edge.target, edge.targetOrient);

    return {
      data: {
        id: `link::${edge.id}::${index}`,
        source: mapped.sourceEndpointId,
        target: mapped.targetEndpointId,
        kind: 'gfa-link',
        originalEdgeId: edge.id,
        sourceSegment: edge.source,
        targetSegment: edge.target,
        sourceOrient: edge.sourceOrient,
        targetOrient: edge.targetOrient,
        overlap: edge.overlap,
        tags: edge.tags,
      },
      classes: 'gfa-link',
    };
  });

  return { nodes, edges: [...bodyEdges, ...linkEdges] };
}
