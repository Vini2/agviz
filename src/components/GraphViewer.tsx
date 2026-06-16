import { useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { AssemblyGraph } from '../graph/graphTypes';
import type { AssemblyNode, AssemblyEdge } from '../graph/graphTypes';
import { graphToCytoscape } from '../graph/cytoscapeElements';
import { defaultStylesheet } from '../graph/styles';
import {
  getLayoutOptions,
  LARGE_GRAPH_NODE_THRESHOLD,
  LARGE_GRAPH_EDGE_THRESHOLD,
} from '../graph/layouts';
import type { LayoutName } from '../graph/layouts';

cytoscape.use(fcose);

type SelectedElement =
  | { kind: 'node'; data: AssemblyNode }
  | { kind: 'edge'; data: AssemblyEdge }
  | null;

interface GraphViewerProps {
  graph: AssemblyGraph | null;
  layout: LayoutName;
  onSelect: (element: SelectedElement) => void;
}

export function GraphViewer({ graph, layout, onSelect }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const handleSelect = useCallback(
    (event: cytoscape.EventObject) => {
      const ele = event.target;
      if (ele.isNode()) {
        onSelect({ kind: 'node', data: ele.data() as AssemblyNode });
      } else if (ele.isEdge()) {
        onSelect({ kind: 'edge', data: ele.data() as AssemblyEdge });
      }
    },
    [onSelect],
  );

  const handleUnselect = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: defaultStylesheet,
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });

    cy.on('select', 'node, edge', handleSelect);
    cy.on('unselect', 'node, edge', handleUnselect);

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [handleSelect, handleUnselect]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().remove();

    if (!graph) return;

    if (
      graph.stats.nodeCount > LARGE_GRAPH_NODE_THRESHOLD ||
      graph.stats.edgeCount > LARGE_GRAPH_EDGE_THRESHOLD
    ) {
      console.warn(
        `Large graph: ${graph.stats.nodeCount} nodes, ${graph.stats.edgeCount} edges. Using grid layout.`,
      );
    }

    const elements = graphToCytoscape(graph);
    cy.add([...elements.nodes, ...elements.edges]);

    const effectiveLayout =
      graph.stats.nodeCount > LARGE_GRAPH_NODE_THRESHOLD ||
      graph.stats.edgeCount > LARGE_GRAPH_EDGE_THRESHOLD
        ? 'grid'
        : layout;

    cy.layout(getLayoutOptions(effectiveLayout)).run();
    cy.fit();
  }, [graph, layout]);

  return (
    <div className="graph-viewer-wrapper">
      {!graph && (
        <div className="graph-viewer-placeholder">
          <p>Upload a GFA file to visualise the assembly graph.</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="graph-viewer-canvas"
        aria-label="Assembly graph canvas"
        role="img"
      />
    </div>
  );
}
