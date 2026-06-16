# AGENTS.md

## Mission

Build **AgViz**, a browser-native TypeScript application for visualising genome assembly graphs from GFA files.

The MVP is:

> Upload GFA → parse graph → render segments as nodes and links as edges → inspect selected elements.

## Agent operating rules

1. Keep the project browser-only for the MVP.
2. Do not port Bandage.
3. Do not add Qt/WebAssembly.
4. Do not make agtools a runtime dependency.
5. Keep parser, graph model, Cytoscape adapter, and UI separate.
6. Add tests with every meaningful parser or graph-model change.
7. Keep commits small and reviewable.
8. Prefer plain, explicit TypeScript over clever abstractions.
9. Document commands in README.
10. Make the app usable locally with `npm install`, `npm run dev`, and `npm test`.

## First task

Scaffold the Vite React TypeScript app and add a minimal parser/viewer path for `public/examples/tiny.gfa`.

Do not start with advanced features.
