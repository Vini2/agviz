# Copilot instructions for AgViz

## Project identity

This repository is **AgViz**, short for **Assembly Graph Visualisation**.

AgViz is a new browser-native tool for visualising genome assembly graphs from GFA files.

AgViz is **not** a Bandage port. Do not try to recreate Bandage using Qt/WebAssembly. Use Bandage only as a behavioural reference for how assembly graph visualisation should feel to users.

AgViz is also **not** a browser wrapper around agtools. Use agtools only as conceptual inspiration and as a possible future Pyodide experiment.

The first goal is simple:

> Upload GFA → parse graph → render segments as nodes and links as edges → inspect selected nodes and edges.

## Preferred stack

Use this stack unless the user explicitly changes direction:

- TypeScript
- Vite
- React
- Cytoscape.js
- cytoscape-fcose
- Vitest
- Playwright later for browser-level smoke tests
- Plain CSS, CSS modules, or Tailwind only if already added

Do not add a backend for the MVP.

Do not add Pyodide, Graphviz/Wasm, WebGPU, or server-side graph processing until the browser-native MVP works.

## Architecture rules

Keep these layers separate:

1. GFA parsing
2. Internal assembly graph model
3. Cytoscape adapter
4. React UI components

Do not parse GFA inside React components.

Do not use Cytoscape element objects as the canonical biological data model.

Do not bury GFA or assembly graph assumptions in UI code.

Prefer small, typed functions with unit tests.

## Target repository structure

Aim for this structure:

```text
src/
  gfa/
    gfaTypes.ts
    parseGfa.ts
    gfaToGraph.ts
    gfaValidation.ts

  graph/
    graphTypes.ts
    graphStats.ts
    cytoscapeElements.ts
    layouts.ts
    styles.ts

  components/
    FileUpload.tsx
    GraphViewer.tsx
    InspectorPanel.tsx
    Toolbar.tsx
    StatusBar.tsx
    LayoutControls.tsx

  workers/
    gfaParser.worker.ts

  utils/
    file.ts
    format.ts
    errors.ts

public/
  examples/
    tiny.gfa
    simple_cycle.gfa
    branching_graph.gfa

docs/
  design.md
  gfa-support.md
  roadmap.md
```

## GFA support for the MVP

Support these GFA records first:

- `H`: header
- `S`: segment
- `L`: link
- `P`: path, parsed initially but not necessarily visualised

Later records:

- `W`: walk
- `J`: jump
- GFA2 records, only after GFA1 support is stable

## Parser requirements

Implement:

- `parseGfa(text: string): ParsedGfa`
- `parseTags(fields: string[]): GfaTag[]`
- `tagListToObject(tags: GfaTag[]): Record<string, string>`

Parser behaviour:

- split lines safely;
- handle Unix and Windows newlines;
- skip empty lines;
- split records by tab;
- preserve each raw line;
- collect warnings for malformed or unsupported non-critical lines;
- throw only for fatal errors;
- keep tags as data rather than overinterpreting them in the parser.

## Internal graph model

Use a browser-native TypeScript graph model.

Expected core interfaces:

```ts
export interface AssemblyNode {
  id: string;
  label: string;
  length?: number;
  sequence?: string;
  coverage?: number;
  tags: Record<string, string>;
  degree?: number;
}

export interface AssemblyEdge {
  id: string;
  source: string;
  target: string;
  sourceOrient?: "+" | "-";
  targetOrient?: "+" | "-";
  overlap?: string;
  tags: Record<string, string>;
}

export interface AssemblyGraph {
  nodes: AssemblyNode[];
  edges: AssemblyEdge[];
  warnings: string[];
  stats: AssemblyGraphStats;
}
```

## Rendering requirements

Use Cytoscape.js for graph rendering.

Initial layout options:

- `fcose`
- `cose`
- `breadthfirst`
- `circle`
- `grid`

Default to `fcose` for small-to-medium graphs.

For larger graphs, warn the user and use a simpler layout.

## UI requirements

The initial interface should include:

- project title: AgViz
- file upload button
- drag-and-drop upload zone
- graph canvas
- graph statistics panel
- selected node/edge inspector
- layout selector
- status bar with node and edge counts
- warning display for unsupported or malformed GFA records

## Inspector behaviour

When a node is selected, show:

- segment ID
- length
- coverage if available
- degree
- sequence preview
- tags
- connected neighbours

When an edge is selected, show:

- source
- target
- source orientation
- target orientation
- overlap/CIGAR
- tags
- raw line if available

## Styling guidance

For nodes:

- label by segment ID;
- scale size using log length, not raw length;
- optionally colour by coverage;
- visually distinguish selected nodes.

For edges:

- use directed arrows;
- store orientation metadata;
- show orientation and overlap in the inspector;
- avoid overcomplicated orientation glyphs in the first version.

## Performance guidance

Assembly graphs can be large.

MVP guidance:

- warn above 5,000 nodes or 10,000 edges;
- avoid promising support for huge metagenome graphs initially;
- use a simple layout for large graphs;
- add Web Worker parsing once basic functionality works;
- later add length/coverage filtering and neighbourhood extraction.

## Testing requirements

Add tests for:

- parsing a minimal GFA;
- parsing `S` records;
- parsing `L` records and orientation;
- parsing optional tags;
- preserving raw lines;
- handling `*` sequence with `LN:i`;
- converting parsed GFA to `AssemblyGraph`;
- converting `AssemblyGraph` to Cytoscape elements;
- producing useful warnings for unsupported records.

## Commands

The repository should support:

```bash
npm install
npm run dev
npm test
npm run build
```

If adding a new command, document it in `README.md`.

## Do not do yet

Do not:

- port Bandage;
- introduce Qt;
- require a server;
- require Python for the MVP;
- add Pyodide before the TypeScript parser works;
- add Graphviz/Wasm before Cytoscape rendering works;
- optimise prematurely;
- implement every Bandage feature;
- depend on huge bundled example data.

## Definition of done for the first prototype

The first prototype is done when:

- `npm install` succeeds;
- `npm run dev` launches the app;
- `npm test` passes;
- a user can upload `public/examples/tiny.gfa`;
- the graph displays two connected nodes;
- selecting a node shows metadata;
- selecting an edge shows metadata;
- malformed GFA gives a useful warning or error;
- the UI clearly identifies the project as AgViz.

## Development style

Prefer incremental pull requests.

Each PR should do one thing:

- scaffold project;
- add parser;
- add graph model;
- add Cytoscape viewer;
- add inspector;
- add tests;
- add examples;
- add deployment.

When uncertain, implement the smallest tested browser-native version first.
