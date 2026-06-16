# Frontend implementation instructions

Apply these instructions to React components, Cytoscape integration, and UI code.

## UI target

AgViz should feel like a focused scientific visualisation tool:

- upload area;
- graph canvas;
- graph statistics;
- selected element inspector;
- layout selector;
- warning/error panel.

## Cytoscape rules

- Create Cytoscape elements only from the internal `AssemblyGraph`.
- Do not store Cytoscape elements as the canonical graph state.
- Initialise Cytoscape in `GraphViewer.tsx`.
- Clean up Cytoscape instances on component unmount.
- Keep Cytoscape styles in `src/graph/styles.ts`.
- Keep layout definitions in `src/graph/layouts.ts`.

## React rules

- Keep file upload in `FileUpload.tsx`.
- Keep selected element display in `InspectorPanel.tsx`.
- Keep graph rendering in `GraphViewer.tsx`.
- Avoid parsing GFA inside UI components.
- Display parser warnings clearly.

## Accessibility

- File upload should work through button and drag-and-drop.
- Buttons should have clear labels.
- Error messages should be visible as text, not only colour.

## Large graph behaviour

If the graph is large, warn the user before expensive layout.

Initial thresholds:

- more than 5,000 nodes;
- more than 10,000 edges.
