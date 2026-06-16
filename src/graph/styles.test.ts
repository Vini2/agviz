import { describe, expect, it } from 'vitest';
import { defaultStylesheet } from './styles';

function findStyle(selector: string) {
  const entry = defaultStylesheet.find((style) => style.selector === selector);
  expect(entry).toBeDefined();
  return entry!.style as Record<string, unknown>;
}

describe('defaultStylesheet', () => {
  it('renders nodes as rounded contig bars sized from data', () => {
    const nodeStyle = findStyle('node');
    expect(nodeStyle['shape']).toBe('round-rectangle');
    expect(nodeStyle['width']).toBe('data(width)');
    expect(nodeStyle['height']).toBe('data(height)');
    expect(nodeStyle['label']).toBe('data(label)');
    expect(Number(nodeStyle['border-width'])).toBeLessThanOrEqual(1);
    expect(String(nodeStyle['font-size'])).toContain('7');
  });

  it('renders edges as thin curved non-directional links', () => {
    const edgeStyle = findStyle('edge');
    expect(edgeStyle['target-arrow-shape']).toBe('none');
    expect(edgeStyle['source-arrow-shape']).toBe('none');
    expect(edgeStyle['curve-style']).toBe('unbundled-bezier');
    expect(Number(edgeStyle['width'])).toBeLessThanOrEqual(1.5);
    expect(edgeStyle['label']).toBe('');
  });
});
