import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { GraphOverlay } from './GraphOverlay';
import type { AssemblyGraph } from '../graph/graphTypes';

// Make requestAnimationFrame synchronous in JSDOM
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Minimal Cytoscape mock that returns known endpoint positions
function makeCyMock(
  positions: Record<string, { x: number; y: number }>,
  pan = { x: 0, y: 0 },
  zoom = 1,
) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    pan: () => pan,
    zoom: () => zoom,
    getElementById: vi.fn().mockImplementation((id: string) => {
      const pos = positions[id];
      return {
        length: pos !== undefined ? 1 : 0,
        position: () => pos ?? { x: 0, y: 0 },
      };
    }),
  };
}

const singleSegmentGraph: AssemblyGraph = {
  nodes: [{ id: 'seg1', label: 'seg1', length: 5000, coverage: 20, tags: {} }],
  edges: [],
  warnings: [],
  stats: { nodeCount: 1, edgeCount: 0, totalLength: 5000 },
};

const twoSegmentGraph: AssemblyGraph = {
  nodes: [
    { id: 'A', label: 'A', length: 1000, coverage: 10, tags: {} },
    { id: 'B', label: 'B', length: 2000, coverage: 20, tags: {} },
  ],
  edges: [
    {
      id: 'A-B',
      source: 'A',
      target: 'B',
      sourceOrient: '+',
      targetOrient: '+',
      overlap: '100M',
      tags: {},
    },
  ],
  warnings: [],
  stats: { nodeCount: 2, edgeCount: 1, totalLength: 3000 },
};

const singleSegPositions = {
  'seg1::__left': { x: 0, y: 0 },
  'seg1::__right': { x: 100, y: 0 },
};

const twoSegPositions = {
  'A::__left': { x: 0, y: 0 },
  'A::__right': { x: 50, y: 0 },
  'B::__left': { x: 100, y: 0 },
  'B::__right': { x: 200, y: 0 },
};

describe('GraphOverlay', () => {
  it('renders nothing when graph is null', () => {
    const cy = makeCyMock({});
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={null}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders nothing when cy is null', () => {
    const { container } = render(
      <GraphOverlay
        cy={null}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an SVG overlay for a single-segment graph', async () => {
    const cy = makeCyMock(singleSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('svg.graph-overlay')).not.toBeNull();
    });
  });

  it('renders one path per segment', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(2);
    });
  });

  it('renders a major arc path (A command) for a single-segment graph', async () => {
    const cy = makeCyMock(singleSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const path = container.querySelector('path');
      expect(path).not.toBeNull();
      expect(path!.getAttribute('d')).toMatch(/ A /);
    });
  });

  it('renders curved Bezier paths (Q command) for multi-segment graphs', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(1);
      // All segment paths should use quadratic Bezier (Q), not straight lines
      paths.forEach((p) => {
        expect(p.getAttribute('d')).toContain('Q ');
      });
    });
  });

  it('paths do not contain a straight L command', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((p) => {
        expect(p.getAttribute('d')).not.toMatch(/ L /);
      });
    });
  });

  it('applies default contig colour when colorByCoverage is false (light theme)', async () => {
    const cy = makeCyMock(singleSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const path = container.querySelector('path');
      expect(path!.getAttribute('stroke')).toBe('#2563eb');
    });
  });

  it('applies coverage colour when colorByCoverage is true', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={true}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
      // Coverage colours should be rgb(...) values, not the default hex contig colour
      paths.forEach((p) => {
        expect(p.getAttribute('stroke')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      });
    });
  });

  it('applies selection colour to the selected segment', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId="A"
      />,
    );

    await waitFor(() => {
      // Find path for segment A (first path in DOM order matches first node)
      const groups = container.querySelectorAll('g');
      expect(groups.length).toBe(2);

      // Segment A's path should use the selection colour
      const aPath = groups[0].querySelector('path');
      expect(aPath!.getAttribute('stroke')).toBe('#d97706'); // light theme contigSelectionColor
    });
  });

  it('applies dark theme colours', async () => {
    const cy = makeCyMock(singleSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="dark"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const path = container.querySelector('path');
      expect(path!.getAttribute('stroke')).toBe('#7dd3fc'); // dark theme default contig colour
    });
  });

  it('uses pan and zoom offsets for viewport coordinates', async () => {
    const cy = makeCyMock(singleSegPositions, { x: 50, y: 100 }, 2);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const path = container.querySelector('path');
      expect(path).not.toBeNull();
      // With pan=(50,100) zoom=2: left (0*2+50=50, 0*2+100=100), right (100*2+50=250, 0*2+100=100)
      const d = path!.getAttribute('d')!;
      expect(d).toMatch(/^M 50 100 /);
    });
  });

  it('registers viewport and layoutstop events on cy', async () => {
    const cy = makeCyMock(singleSegPositions);
    render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      expect(cy.on).toHaveBeenCalledWith('viewport', expect.any(Function));
      expect(cy.on).toHaveBeenCalledWith('layoutstop', expect.any(Function));
    });
  });

  it('renders labels for each segment', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    await waitFor(() => {
      const texts = container.querySelectorAll('text');
      expect(texts).toHaveLength(2);
      const labels = Array.from(texts).map((t) => t.textContent);
      expect(labels).toContain('A');
      expect(labels).toContain('B');
    });
  });

  it('hides labels and uses per-segment colours in Bandage-style layout', async () => {
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
        layout="bandage"
      />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('text')).toHaveLength(0);

      const strokes = Array.from(container.querySelectorAll('path.contig-path')).map((path) =>
        path.getAttribute('stroke'),
      );
      expect(strokes).toHaveLength(2);
      expect(new Set(strokes).size).toBe(2);
      expect(strokes).not.toContain('#2563eb');
    });
  });

  it('renders clickable Bandage-style link paths', async () => {
    const onLinkSelect = vi.fn();
    const cy = makeCyMock(twoSegPositions);
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={twoSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
        layout="bandage"
        onLinkSelect={onLinkSelect}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('path.link-path')).not.toBeNull();
    });

    const hitPath = container.querySelector('path.link-hit-path');
    expect(hitPath).not.toBeNull();
    fireEvent.click(hitPath!);

    expect(onLinkSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'A-B',
        source: 'A',
        target: 'B',
      }),
    );
  });

  it('renders nothing when no endpoint positions are found in cy', async () => {
    // cy returns no elements for any id
    const cy = makeCyMock({});
    const { container } = render(
      <GraphOverlay
        cy={cy as never}
        graph={singleSegmentGraph}
        themeMode="light"
        colorByCoverage={false}
        selectedSegmentId={null}
      />,
    );

    // No paths should appear
    await waitFor(() => {
      expect(container.querySelector('path')).toBeNull();
    });
  });
});
