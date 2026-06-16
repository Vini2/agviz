export type ThemeMode = 'light' | 'dark';

const lightPalette = {
  low: [191, 219, 254],
  high: [30, 64, 175],
  neutral: '#94a3b8',
};

const darkPalette = {
  low: [125, 211, 252],
  high: [8, 47, 73],
  neutral: '#64748b',
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function mixRgb(start: number[], end: number[], ratio: number): string {
  const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
  const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
  const b = Math.round(start[2] + (end[2] - start[2]) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export function defaultContigColor(theme: ThemeMode): string {
  return theme === 'dark' ? '#7dd3fc' : '#2563eb';
}

export function neutralCoverageColor(theme: ThemeMode): string {
  return theme === 'dark' ? darkPalette.neutral : lightPalette.neutral;
}

export function coverageToColor(
  coverage: number | undefined,
  minCoverage: number,
  maxCoverage: number,
  theme: ThemeMode,
): string {
  if (coverage === undefined || !Number.isFinite(coverage)) {
    return neutralCoverageColor(theme);
  }

  const palette = theme === 'dark' ? darkPalette : lightPalette;

  if (!Number.isFinite(minCoverage) || !Number.isFinite(maxCoverage) || minCoverage >= maxCoverage) {
    return mixRgb(palette.low, palette.high, 0.5);
  }

  const ratio = clamp01((coverage - minCoverage) / (maxCoverage - minCoverage));
  return mixRgb(palette.low, palette.high, ratio);
}

export function coverageMinMax(values: Array<number | undefined>): {
  minCoverage: number;
  maxCoverage: number;
} {
  const numeric = values.filter((value): value is number => value !== undefined && Number.isFinite(value));

  if (numeric.length === 0) {
    return { minCoverage: 0, maxCoverage: 0 };
  }

  return {
    minCoverage: Math.min(...numeric),
    maxCoverage: Math.max(...numeric),
  };
}
