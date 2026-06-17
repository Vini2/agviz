import { useEffect, useRef, useCallback, useState } from 'react';
import type cytoscape from 'cytoscape';
import type { AssemblyGraph } from '../graph/graphTypes';
import type { AssemblyEdge } from '../graph/graphTypes';
import type { ThemeMode } from '../graph/coverageColors';
import {
  bandageSegmentColor,
  coverageMinMax,
  coverageToColor,
  defaultContigColor,
} from '../graph/coverageColors';
import { contigVisualThickness } from '../graph/visualScale';
import { endpointId, mapLinkEndpoints } from '../graph/cytoscapeElements';
import { deduplicateReciprocalLinks } from '../graph/linkDeduplication';
import { curvedSegmentPath, majorArcPath, graphCentre, type Point } from '../graph/arcGeometry';
import { getThemePalette } from '../graph/styles';
import type { LayoutName } from '../graph/layouts';

interface SegmentPath {
  segmentId: string;
  pathD: string;
  color: string;
  thickness: number;
  label: string;
  labelX: number;
  labelY: number;
}

interface LinkPath {
  id: string;
  pathD: string;
  edge: AssemblyEdge;
}

export interface GraphOverlayProps {
  cy: cytoscape.Core | null;
  graph: AssemblyGraph | null;
  themeMode: ThemeMode;
  colorByCoverage: boolean;
  selectedSegmentId: string | null;
  layout?: LayoutName;
  selectedLinkId?: string | null;
  onLinkSelect?: (edge: AssemblyEdge) => void;
}

function modelToViewport(
  pos: { x: number; y: number },
  pan: { x: number; y: number },
  zoom: number,
): Point {
  return {
    x: pos.x * zoom + pan.x,
    y: pos.y * zoom + pan.y,
  };
}

export function GraphOverlay({
  cy,
  graph,
  themeMode,
  colorByCoverage,
  selectedSegmentId,
  layout,
  selectedLinkId,
  onLinkSelect,
}: GraphOverlayProps) {
  const [segmentPaths, setSegmentPaths] = useState<SegmentPath[]>([]);
  const [linkPaths, setLinkPaths] = useState<LinkPath[]>([]);
  const rafRef = useRef<number | null>(null);
  const palette = getThemePalette(themeMode);
  const isBandageStyle = layout === 'bandage';

  const buildPaths = useCallback(() => {
    if (!cy || !graph || graph.nodes.length === 0) {
      setSegmentPaths([]);
      setLinkPaths([]);
      return;
    }

    const pan = cy.pan();
    const zoom = cy.zoom();

    const { minCoverage, maxCoverage } = coverageMinMax(graph.nodes.map((n) => n.coverage));
    const thickness = isBandageStyle ? 2.25 : contigVisualThickness();

    // Collect all endpoint viewport positions to compute graph centre
    const allViewportPositions: Point[] = [];
    for (const node of graph.nodes) {
      const leftEle = cy.getElementById(endpointId(node.id, 'left'));
      const rightEle = cy.getElementById(endpointId(node.id, 'right'));
      if (leftEle.length > 0 && rightEle.length > 0) {
        allViewportPositions.push(modelToViewport(leftEle.position(), pan, zoom));
        allViewportPositions.push(modelToViewport(rightEle.position(), pan, zoom));
      }
    }

    if (allViewportPositions.length === 0) {
      setSegmentPaths([]);
      setLinkPaths([]);
      return;
    }

    const centre = graphCentre(allViewportPositions);
    const isSingleSegment = graph.nodes.length === 1;

    const newPaths: SegmentPath[] = [];

    for (const node of graph.nodes) {
      const leftEle = cy.getElementById(endpointId(node.id, 'left'));
      const rightEle = cy.getElementById(endpointId(node.id, 'right'));
      if (leftEle.length === 0 || rightEle.length === 0) continue;

      const left = modelToViewport(leftEle.position(), pan, zoom);
      const right = modelToViewport(rightEle.position(), pan, zoom);

      const color = colorByCoverage
        ? coverageToColor(node.coverage, minCoverage, maxCoverage, themeMode)
        : isBandageStyle
          ? bandageSegmentColor(node.id)
          : defaultContigColor(themeMode);

      let pathD: string;
      if (isSingleSegment) {
        pathD = majorArcPath(left, right);
      } else {
        pathD = curvedSegmentPath(left, right, centre, isBandageStyle ? 0.42 : 0.25);
      }

      // Label near the chord midpoint
      const labelX = (left.x + right.x) / 2;
      const labelY = (left.y + right.y) / 2;

      newPaths.push({
        segmentId: node.id,
        pathD,
        color,
        thickness,
        label: node.label ?? node.id,
        labelX,
        labelY,
      });
    }

    const newLinkPaths: LinkPath[] = [];
    if (isBandageStyle) {
      deduplicateReciprocalLinks(graph.edges).forEach((group, index) => {
        const representative = group.representative;
        const { sourceEndpointId, targetEndpointId } = mapLinkEndpoints(
          representative.source,
          representative.sourceOrient,
          representative.target,
          representative.targetOrient,
        );
        const sourceEle = cy.getElementById(sourceEndpointId);
        const targetEle = cy.getElementById(targetEndpointId);
        if (sourceEle.length === 0 || targetEle.length === 0) return;

        const source = modelToViewport(sourceEle.position(), pan, zoom);
        const target = modelToViewport(targetEle.position(), pan, zoom);
        const id = `link::${representative.id}::${index}`;

        newLinkPaths.push({
          id,
          pathD: `M ${source.x} ${source.y} L ${target.x} ${target.y}`,
          edge: {
            id: representative.id,
            source: representative.source,
            target: representative.target,
            sourceOrient: representative.sourceOrient,
            targetOrient: representative.targetOrient,
            overlap: representative.overlap,
            tags: representative.tags,
            reciprocalMemberCount: group.members.length,
            reciprocalMembers: group.members.map((edge) => edge.id),
            rawLinks: group.members
              .map((edge) => edge.raw)
              .filter((raw): raw is string => raw !== undefined),
          },
        });
      });
    }

    setSegmentPaths(newPaths);
    setLinkPaths(newLinkPaths);
  }, [cy, graph, themeMode, colorByCoverage, isBandageStyle]);

  // Keep a stable ref to the latest buildPaths so the RAF callback never goes stale
  const buildPathsRef = useRef(buildPaths);
  buildPathsRef.current = buildPaths;

  // Throttle viewport updates to one per animation frame
  const scheduleBuild = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      buildPathsRef.current();
    });
  }, []);

  useEffect(() => {
    if (!cy) return;

    buildPaths();
    cy.on('viewport', scheduleBuild);
    cy.on('layoutstop', buildPaths);

    return () => {
      cy.off('viewport', scheduleBuild);
      cy.off('layoutstop', buildPaths);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cy, buildPaths, scheduleBuild]);

  // Rebuild when graph content, theme, or coverage mode changes
  useEffect(() => {
    buildPaths();
  }, [graph, themeMode, colorByCoverage, buildPaths]);

  if (!graph || segmentPaths.length === 0) return null;

  return (
    <svg
      className="graph-overlay"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {segmentPaths.map(({ segmentId, pathD, color, thickness, label, labelX, labelY }) => {
        const isSelected = segmentId === selectedSegmentId;
        const strokeColor = isSelected ? palette.contigSelectionColor : color;

        return (
          <g key={segmentId}>
            <path
              className="contig-path"
              d={pathD}
              stroke={strokeColor}
              strokeWidth={thickness}
              strokeLinecap="round"
              fill="none"
            />
            {!isBandageStyle && (
              <text
                x={labelX}
                y={labelY}
                fill={palette.textColor}
                fontSize="7"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ userSelect: 'none' }}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
      {linkPaths.map(({ id, pathD, edge }) => {
        const isSelected = edge.id === selectedLinkId;
        const strokeColor = isSelected ? palette.edgeSelectionColor : palette.linkColor;

        return (
          <g key={id}>
            <path
              className="link-path"
              d={pathD}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2 : 1}
              strokeLinecap="round"
              fill="none"
              opacity={0.8}
            />
            <path
              className="link-hit-path"
              d={pathD}
              stroke="transparent"
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
              pointerEvents="stroke"
              onClick={(event) => {
                event.stopPropagation();
                onLinkSelect?.(edge);
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
