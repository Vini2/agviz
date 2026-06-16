interface StatusBarProps {
  nodeCount: number;
  edgeCount: number;
  fileName?: string;
  warnings: string[];
}

export function StatusBar({ nodeCount, edgeCount, fileName, warnings }: StatusBarProps) {
  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span>
        {fileName ? <strong>{fileName}</strong> : 'No file loaded'}
      </span>
      <span className="status-separator">|</span>
      <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
      <span className="status-separator">|</span>
      <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
      {warnings.length > 0 && (
        <>
          <span className="status-separator">|</span>
          <span className="status-warnings" title={warnings.join('\n')}>
            ⚠ {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </span>
        </>
      )}
    </div>
  );
}
