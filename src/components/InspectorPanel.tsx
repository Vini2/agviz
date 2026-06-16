import type { AssemblyNode, AssemblyEdge } from '../graph/graphTypes';

type SelectedElement =
  | { kind: 'node'; data: AssemblyNode }
  | { kind: 'edge'; data: AssemblyEdge }
  | null;

interface InspectorPanelProps {
  selected: SelectedElement;
}

function TagTable({ tags }: { tags: Record<string, string> }) {
  const entries = Object.entries(tags);
  if (entries.length === 0) return <p className="inspector-none">No tags</p>;
  return (
    <table className="inspector-tags">
      <thead>
        <tr>
          <th>Tag</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NodeInspector({ node }: { node: AssemblyNode }) {
  return (
    <div className="inspector-content">
      <h3>Segment: {node.id}</h3>
      <dl className="inspector-dl">
        <dt>ID</dt>
        <dd>{node.id}</dd>
        {node.length !== undefined && (
          <>
            <dt>Length</dt>
            <dd>{node.length.toLocaleString()} bp</dd>
          </>
        )}
        {node.coverage !== undefined && (
          <>
            <dt>Coverage</dt>
            <dd>{node.coverage.toFixed(1)}×</dd>
          </>
        )}
        {node.degree !== undefined && (
          <>
            <dt>Degree</dt>
            <dd>{node.degree}</dd>
          </>
        )}
        {node.sequence && (
          <>
            <dt>Sequence preview</dt>
            <dd className="inspector-seq">
              {node.sequence.length > 60
                ? node.sequence.slice(0, 60) + '…'
                : node.sequence}
            </dd>
          </>
        )}
      </dl>
      <h4>Tags</h4>
      <TagTable tags={node.tags} />
    </div>
  );
}

function EdgeInspector({ edge }: { edge: AssemblyEdge }) {
  return (
    <div className="inspector-content">
      <h3>Link: {edge.id}</h3>
      <dl className="inspector-dl">
        <dt>Source</dt>
        <dd>{edge.source}</dd>
        <dt>Source orientation</dt>
        <dd>{edge.sourceOrient ?? '?'}</dd>
        <dt>Target</dt>
        <dd>{edge.target}</dd>
        <dt>Target orientation</dt>
        <dd>{edge.targetOrient ?? '?'}</dd>
        {edge.overlap && (
          <>
            <dt>Overlap / CIGAR</dt>
            <dd>{edge.overlap}</dd>
          </>
        )}
        <dt>GFA link records represented</dt>
        <dd>{edge.reciprocalMemberCount ?? 1}</dd>
      </dl>
      {edge.rawLinks && edge.rawLinks.length > 0 && (
        <>
          <h4>Raw links</h4>
          <ul className="inspector-raw-links">
            {edge.rawLinks.map((raw, index) => (
              <li key={`${edge.id}-raw-${index}`}>
                <code>{raw}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      <h4>Tags</h4>
      <TagTable tags={edge.tags} />
    </div>
  );
}

export function InspectorPanel({ selected }: InspectorPanelProps) {
  return (
    <aside className="inspector-panel" aria-label="Element inspector">
      <h2>Inspector</h2>
      {!selected && (
        <p className="inspector-none">Select a node or edge to inspect it.</p>
      )}
      {selected?.kind === 'node' && <NodeInspector node={selected.data} />}
      {selected?.kind === 'edge' && <EdgeInspector edge={selected.data} />}
    </aside>
  );
}
