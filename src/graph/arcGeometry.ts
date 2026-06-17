export interface Point {
  x: number;
  y: number;
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function graphCentre(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * Returns an SVG quadratic Bezier path for a curved contig segment body.
 *
 * The control point is placed on the normal to the chord, in the direction
 * that points away from the graph centre. This causes segments to bow outward,
 * giving a circular assembly-graph feel.
 *
 * The chord length (endpoint separation) is used as the basis for curvature,
 * so relative proportions are preserved regardless of absolute scale.
 */
export function curvedSegmentPath(
  left: Point,
  right: Point,
  centre: Point,
  curvature = 0.25,
): string {
  const mid = midpoint(left, right);
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const chordLength = Math.hypot(dx, dy) || 1;

  // Perpendicular unit vector (rotated 90° from chord direction)
  let nx = -dy / chordLength;
  let ny = dx / chordLength;

  // Ensure the bend points away from the graph centre
  const centreVecX = mid.x - centre.x;
  const centreVecY = mid.y - centre.y;
  if (nx * centreVecX + ny * centreVecY < 0) {
    nx = -nx;
    ny = -ny;
  }

  const bend = chordLength * curvature;
  const cx = mid.x + nx * bend;
  const cy = mid.y + ny * bend;

  return `M ${left.x} ${left.y} Q ${cx} ${cy} ${right.x} ${right.y}`;
}

/**
 * Returns an SVG arc path for a single-segment graph.
 *
 * Uses the SVG arc command with largeArcFlag=1 so the segment appears as a
 * major arc rather than a small curve. A radius of 0.75× the chord length
 * (minimum 30) is used when no radius is provided.
 */
export function majorArcPath(
  left: Point,
  right: Point,
  radius?: number,
  sweep: 0 | 1 = 1,
): string {
  const dist = Math.hypot(right.x - left.x, right.y - left.y) || 1;
  const r = radius ?? Math.max(dist * 0.75, 30);
  return `M ${left.x} ${left.y} A ${r} ${r} 0 1 ${sweep} ${right.x} ${right.y}`;
}
