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
  });

  it('renders edges without directional arrowheads', () => {
    const edgeStyle = findStyle('edge');
    expect(edgeStyle['target-arrow-shape']).toBe('none');
    expect(edgeStyle['source-arrow-shape']).toBe('none');
    expect(edgeStyle['label']).toBe('');
  });
});
