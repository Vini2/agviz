import { describe, it, expect } from 'vitest';
import {
  midpoint,
  graphCentre,
  curvedSegmentPath,
  majorArcPath,
  type Point,
} from './arcGeometry';

describe('midpoint', () => {
  it('computes the midpoint of two points', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 4 })).toEqual({ x: 2, y: 2 });
  });

  it('handles negative coordinates', () => {
    expect(midpoint({ x: -2, y: 3 }, { x: 2, y: -3 })).toEqual({ x: 0, y: 0 });
  });

  it('handles coincident points', () => {
    expect(midpoint({ x: 5, y: 7 }, { x: 5, y: 7 })).toEqual({ x: 5, y: 7 });
  });
});

describe('graphCentre', () => {
  it('returns origin for an empty array', () => {
    expect(graphCentre([])).toEqual({ x: 0, y: 0 });
  });

  it('returns the point itself for a single-element array', () => {
    expect(graphCentre([{ x: 5, y: 7 }])).toEqual({ x: 5, y: 7 });
  });

  it('computes the centroid of four corners of a square', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(graphCentre(points)).toEqual({ x: 2, y: 2 });
  });

  it('handles two points', () => {
    expect(graphCentre([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toEqual({ x: 5, y: 0 });
  });
});

describe('curvedSegmentPath', () => {
  it('returns a string starting with M', () => {
    const path = curvedSegmentPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 });
    expect(path).toMatch(/^M /);
  });

  it('contains a Q (quadratic Bezier) command', () => {
    const path = curvedSegmentPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 });
    expect(path).toContain('Q ');
  });

  it('is not a straight-line M ... L ... path', () => {
    const path = curvedSegmentPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 0 });
    expect(path).not.toMatch(/ L /);
  });

  it('is deterministic for fixed input', () => {
    const a = curvedSegmentPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 });
    const b = curvedSegmentPath({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 });
    expect(a).toBe(b);
  });

  it('starts at the left point and ends at the right point', () => {
    const left: Point = { x: 10, y: 20 };
    const right: Point = { x: 110, y: 20 };
    const path = curvedSegmentPath(left, right, { x: 60, y: 70 });
    expect(path).toMatch(/^M 10 20 /);
    expect(path).toMatch(/ 110 20$/);
  });

  it('handles coincident endpoints without NaN', () => {
    const path = curvedSegmentPath({ x: 50, y: 50 }, { x: 50, y: 50 }, { x: 0, y: 0 });
    expect(path).not.toContain('NaN');
  });

  it('handles near-coincident endpoints without NaN', () => {
    const path = curvedSegmentPath(
      { x: 50, y: 50 },
      { x: 50.001, y: 50 },
      { x: 0, y: 0 },
    );
    expect(path).not.toContain('NaN');
  });

  it('uses a custom curvature value', () => {
    const straight = curvedSegmentPath(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: -100 },
      0,
    );
    const curved = curvedSegmentPath(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: -100 },
      0.5,
    );
    expect(straight).not.toBe(curved);
  });
});

describe('majorArcPath', () => {
  it('returns a string starting with M', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(path).toMatch(/^M /);
  });

  it('contains an A (arc) SVG command', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(path).toMatch(/ A /);
  });

  it('uses the large arc flag (1)', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 });
    // A rx ry xAxisRotation largeArcFlag sweepFlag x y
    expect(path).toMatch(/A [\d.]+ [\d.]+ 0 1/);
  });

  it('uses a provided radius', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 80);
    expect(path).toContain('A 80 80');
  });

  it('respects the sweep flag 0', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 80, 0);
    expect(path).toContain('0 1 0 ');
  });

  it('uses sweep flag 1 by default', () => {
    const path = majorArcPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 80);
    expect(path).toContain('0 1 1 ');
  });

  it('handles coincident endpoints without NaN', () => {
    const path = majorArcPath({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(path).not.toContain('NaN');
  });

  it('starts at the left point', () => {
    const path = majorArcPath({ x: 10, y: 20 }, { x: 110, y: 20 }, 80);
    expect(path).toMatch(/^M 10 20 /);
  });
});
