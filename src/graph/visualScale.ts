export interface LengthScaleConfig {
  pixelsPerBase: number;
  minVisualLengthPx: number;
  maxVisualLengthPx?: number;
}

export const DEFAULT_LENGTH_SCALE: LengthScaleConfig = {
  pixelsPerBase: 0.05,
  minVisualLengthPx: 8,
};

const CONTIG_VISUAL_THICKNESS = 6;

export function contigVisualLength(
  lengthBp: number | undefined,
  config: LengthScaleConfig = DEFAULT_LENGTH_SCALE,
): number {
  if (!lengthBp || lengthBp <= 0) {
    return config.minVisualLengthPx;
  }

  const raw = lengthBp * config.pixelsPerBase;
  const withMin = Math.max(config.minVisualLengthPx, raw);

  if (config.maxVisualLengthPx === undefined) {
    return withMin;
  }

  return Math.min(config.maxVisualLengthPx, withMin);
}

export function contigVisualThickness(): number {
  return CONTIG_VISUAL_THICKNESS;
}
