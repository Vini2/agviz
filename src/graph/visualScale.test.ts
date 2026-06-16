import { describe, expect, it } from 'vitest';
import {
  contigVisualLength,
  contigVisualThickness,
  DEFAULT_LENGTH_SCALE,
  type LengthScaleConfig,
} from './visualScale';

describe('contigVisualLength', () => {
  const proportionalConfig: LengthScaleConfig = {
    pixelsPerBase: 0.1,
    minVisualLengthPx: 0,
  };

  it('is proportional for biological lengths', () => {
    expect(contigVisualLength(2000, proportionalConfig)).toBeCloseTo(
      contigVisualLength(1000, proportionalConfig) * 2,
    );
  });

  it('uses minimum for unknown length', () => {
    expect(contigVisualLength(undefined)).toBe(DEFAULT_LENGTH_SCALE.minVisualLengthPx);
  });

  it('uses minimum for zero and negative lengths', () => {
    expect(contigVisualLength(0)).toBe(DEFAULT_LENGTH_SCALE.minVisualLengthPx);
    expect(contigVisualLength(-1)).toBe(DEFAULT_LENGTH_SCALE.minVisualLengthPx);
  });

  it('does not cap by default', () => {
    expect(contigVisualLength(1_000_000)).toBe(50_000);
  });

  it('respects optional maxVisualLengthPx when provided', () => {
    expect(
      contigVisualLength(1_000_000, {
        pixelsPerBase: 0.05,
        minVisualLengthPx: 8,
        maxVisualLengthPx: 100,
      }),
    ).toBe(100);
  });

  it('returns finite values', () => {
    expect(Number.isFinite(contigVisualLength(undefined))).toBe(true);
    expect(Number.isFinite(contigVisualLength(2000))).toBe(true);
  });
});

describe('contigVisualThickness', () => {
  it('returns a fixed positive thickness', () => {
    expect(contigVisualThickness()).toBeGreaterThan(0);
    expect(contigVisualThickness()).toBe(6);
  });
});
