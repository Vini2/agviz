import type cytoscape from 'cytoscape';

export const defaultStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      width: 'data(size)',
      height: 'data(size)',
      'background-color': '#4a9eff',
      'border-color': '#2563eb',
      'border-width': 2,
      color: '#fff',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '10px',
      'font-weight': 'bold',
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
      width: 2,
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      width: 3,
    } as cytoscape.Css.Edge,
  },
];
