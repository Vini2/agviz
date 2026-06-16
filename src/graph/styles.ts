import type cytoscape from 'cytoscape';

export const defaultStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      shape: 'round-rectangle',
      label: 'data(label)',
      width: 'data(width)',
      height: 'data(height)',
      'background-color': '#4a9eff',
      'border-color': '#2563eb',
      'border-width': 0.5,
      color: '#fff',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '7px',
      'text-opacity': 0.85,
      'font-weight': 'bold',
      'text-wrap': 'ellipsis',
      'text-max-width': 'data(width)',
      'text-outline-color': '#2563eb',
      'text-outline-width': 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node:selected',
    style: {
      'background-color': '#f59e0b',
      'border-color': '#b45309',
      'border-width': 3,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'edge',
    style: {
      width: 0.75,
      'line-color': '#94a3b8',
      'target-arrow-shape': 'none',
      'source-arrow-shape': 'none',
      'curve-style': 'unbundled-bezier',
      'control-point-distances': 18,
      'control-point-weights': 0.5,
      'line-opacity': 0.75,
      label: '',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#f59e0b',
      width: 1.5,
    } as cytoscape.Css.Edge,
  },
];
