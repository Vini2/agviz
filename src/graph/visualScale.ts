export const MIN_CONTIG_WIDTH = 20;
export const MAX_CONTIG_WIDTH = 140;
export const DEFAULT_CONTIG_HEIGHT = 10;
const CONTIG_WIDTH_BASE_OFFSET = 16;
const CONTIG_WIDTH_LOG_MULTIPLIER = 24;

export function contigVisualWidth(length?: number): number {
  if (!length || length <= 0) {
    return MIN_CONTIG_WIDTH;
  }

  const scaled = CONTIG_WIDTH_BASE_OFFSET + Math.log10(length + 1) * CONTIG_WIDTH_LOG_MULTIPLIER;
  return Math.max(MIN_CONTIG_WIDTH, Math.min(MAX_CONTIG_WIDTH, scaled));
}

export function contigVisualHeight(): number {
  return DEFAULT_CONTIG_HEIGHT;
}
