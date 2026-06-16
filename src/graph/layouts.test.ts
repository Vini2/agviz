import { describe, expect, it } from 'vitest';
import { chooseDefaultLayout, getLayoutOptions, LAYOUT_NAMES } from './layouts';

describe('layouts', () => {
  it('includes circle and concentric layout options', () => {
    expect(LAYOUT_NAMES).toContain('circle');
    expect(LAYOUT_NAMES).toContain('concentric');
  });

  it('uses compact fcose settings for curved graph flow', () => {
    const options = getLayoutOptions('fcose') as Record<string, unknown>;
    expect(options.name).toBe('fcose');
    expect(Number(options.idealEdgeLength)).toBeLessThanOrEqual(30);
    expect(options.nodeDimensionsIncludeLabels).toBe(false);
  });

  it('configures concentric layout', () => {
    const options = getLayoutOptions('concentric') as Record<string, unknown>;
    expect(options.name).toBe('concentric');
    expect(options.nodeDimensionsIncludeLabels).toBe(false);
    expect(typeof options.concentric).toBe('function');
  });

  it('defaults tiny cycle-like graphs to circle', () => {
    expect(
      chooseDefaultLayout({
        nodes: new Array(6).fill(0).map((_, i) => ({ id: `n${i}`, label: `n${i}`, tags: {} })),
        edges: new Array(6).fill(0).map((_, i) => ({
          id: `e${i}`,
          source: `n${i}`,
          target: `n${(i + 1) % 6}`,
          tags: {},
        })),
        warnings: [],
        stats: { nodeCount: 6, edgeCount: 6, totalLength: 0 },
      }),
    ).toBe('circle');
  });
});
