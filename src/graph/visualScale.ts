export const MIN_CONTIG_WIDTH = 36;
export const MAX_CONTIG_WIDTH = 260;
export const DEFAULT_CONTIG_HEIGHT = 22;

export function contigVisualWidth(length?: number): number {
  if (!length || length <= 0) {
    return MIN_CONTIG_WIDTH;
  }

  const scaled = 24 + Math.log10(length + 1) * 42;
  return Math.max(MIN_CONTIG_WIDTH, Math.min(MAX_CONTIG_WIDTH, scaled));
}

export function contigVisualHeight(_length?: number): number {
  return DEFAULT_CONTIG_HEIGHT;
}
