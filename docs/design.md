# AgViz design notes

## Curved contig visual direction

The current Cytoscape-native implementation uses thin rounded-rectangle nodes as capsule-like contig ribbons and curved, non-directional edges to emphasize circular assembly-graph flow.

This is an intentional approximation for the MVP because Cytoscape does not natively support true inward-curving contig body geometry.

## TODO: true curved contig rendering

Future work for biologically richer curved segments should use one of these approaches:

- custom SVG/canvas overlay paths anchored to Cytoscape node positions;
- endpoint/port modeling (for example, left/right endpoint nodes per contig);
- representing contigs as styled edges in an alternate rendering mode.

This should be implemented only when it can be done with clear tests and without destabilizing current parsing, graph model, and inspector behavior.
