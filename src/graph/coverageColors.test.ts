import { describe, expect, it } from 'vitest';
import {
  coverageMinMax,
  coverageToColor,
  defaultContigColor,
  neutralCoverageColor,
} from './coverageColors';

describe('coverageMinMax', () => {
  it('ignores undefined values', () => {
    expect(coverageMinMax([undefined, 10, 2, undefined, 20])).toEqual({
      minCoverage: 2,
      maxCoverage: 20,
    });
  });

  it('returns zeros when all values are missing', () => {
    expect(coverageMinMax([undefined, undefined])).toEqual({ minCoverage: 0, maxCoverage: 0 });
  });
});

describe('coverageToColor', () => {
  it('returns neutral color when coverage is missing', () => {
    expect(coverageToColor(undefined, 1, 10, 'light')).toBe(neutralCoverageColor('light'));
  });

  it('returns valid rgb colors in both themes', () => {
    expect(coverageToColor(5, 1, 10, 'light')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(coverageToColor(5, 1, 10, 'dark')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('handles min==max by returning a middle color', () => {
    expect(coverageToColor(10, 10, 10, 'light')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });
});

describe('defaultContigColor', () => {
  it('returns different defaults per theme', () => {
    expect(defaultContigColor('light')).not.toBe(defaultContigColor('dark'));
  });
});
