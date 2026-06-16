import type cytoscape from 'cytoscape';

export type LayoutName = 'fcose' | 'cose' | 'breadthfirst' | 'circle' | 'grid';

export const LAYOUT_NAMES: LayoutName[] = ['fcose', 'cose', 'breadthfirst', 'circle', 'grid'];

export const LARGE_GRAPH_NODE_THRESHOLD = 5000;
export const LARGE_GRAPH_EDGE_THRESHOLD = 10000;

export function getLayoutOptions(name: LayoutName): cytoscape.LayoutOptions {
  switch (name) {
    case 'fcose':
      return {
        name: 'fcose',
        animate: false,
        fit: true,
        padding: 40,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 40,
        nodeRepulsion: 8000,
        gravity: 0.25,
        numIter: 2500,
      } as cytoscape.LayoutOptions;
    case 'cose':
      return { name: 'cose', animate: false, fit: true, padding: 40 } as cytoscape.LayoutOptions;
    case 'breadthfirst':
      return {
        name: 'breadthfirst',
        animate: false,
        fit: true,
        padding: 40,
      } as cytoscape.LayoutOptions;
    case 'circle':
      return { name: 'circle', animate: false, fit: true, padding: 40 } as cytoscape.LayoutOptions;
    case 'grid':
      return { name: 'grid', animate: false, fit: true, padding: 40 } as cytoscape.LayoutOptions;
  }
}
