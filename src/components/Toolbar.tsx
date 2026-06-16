import type { LayoutName } from '../graph/layouts';
import { LAYOUT_NAMES } from '../graph/layouts';

interface ToolbarProps {
  layout: LayoutName;
  onLayoutChange: (layout: LayoutName) => void;
  onLoadExample: (example: string) => void;
}

export function Toolbar({ layout, onLayoutChange, onLoadExample }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Graph tools">
      <span className="toolbar-label">Layout:</span>
      <select
        value={layout}
        onChange={(e) => onLayoutChange(e.target.value as LayoutName)}
        aria-label="Select layout algorithm"
      >
        {LAYOUT_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <span className="toolbar-divider" aria-hidden="true" />

      <span className="toolbar-label">Examples:</span>
      <button onClick={() => onLoadExample('tiny.gfa')}>tiny.gfa</button>
      <button onClick={() => onLoadExample('simple_cycle.gfa')}>simple_cycle.gfa</button>
      <button onClick={() => onLoadExample('branching_graph.gfa')}>branching_graph.gfa</button>
    </div>
  );
}
