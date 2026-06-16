import { describe, expect, it } from 'vitest';
import {
  canonicalGfaLinkKey,
  deduplicateReciprocalLinks,
  flipOrient,
} from './linkDeduplication';
import type { AssemblyEdge } from './graphTypes';

describe('flipOrient', () => {
  it('flips plus and minus', () => {
    expect(flipOrient('+')).toBe('-');
    expect(flipOrient('-')).toBe('+');
  });
});

describe('canonicalGfaLinkKey', () => {
  it('matches reciprocal keys for A+ -> B+ and B- -> A-', () => {
    const forward = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '+',
      overlap: '100M',
    });
    const reciprocal = canonicalGfaLinkKey({
      from: 'B',
      fromOrient: '-',
      to: 'A',
      toOrient: '-',
      overlap: '100M',
    });
    expect(forward).toBe(reciprocal);
  });

  it('matches reciprocal keys for A+ -> B- and B+ -> A-', () => {
    const forward = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '-',
      overlap: '100M',
    });
    const reciprocal = canonicalGfaLinkKey({
      from: 'B',
      fromOrient: '+',
      to: 'A',
      toOrient: '-',
      overlap: '100M',
    });
    expect(forward).toBe(reciprocal);
  });

  it('matches reciprocal keys for A- -> B+ and B- -> A+', () => {
    const forward = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '-',
      to: 'B',
      toOrient: '+',
      overlap: '100M',
    });
    const reciprocal = canonicalGfaLinkKey({
      from: 'B',
      fromOrient: '-',
      to: 'A',
      toOrient: '+',
      overlap: '100M',
    });
    expect(forward).toBe(reciprocal);
  });

  it('matches reciprocal keys for A- -> B- and B+ -> A+', () => {
    const forward = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '-',
      to: 'B',
      toOrient: '-',
      overlap: '100M',
    });
    const reciprocal = canonicalGfaLinkKey({
      from: 'B',
      fromOrient: '+',
      to: 'A',
      toOrient: '+',
      overlap: '100M',
    });
    expect(forward).toBe(reciprocal);
  });

  it('does not collapse non-reciprocal orientation pairs', () => {
    const one = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '+',
      overlap: '100M',
    });
    const two = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '-',
      overlap: '100M',
    });
    expect(one).not.toBe(two);
  });

  it('does not collapse different overlaps', () => {
    const one = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '+',
      overlap: '100M',
    });
    const two = canonicalGfaLinkKey({
      from: 'A',
      fromOrient: '+',
      to: 'B',
      toOrient: '+',
      overlap: '200M',
    });
    expect(one).not.toBe(two);
  });
});

describe('deduplicateReciprocalLinks', () => {
  function buildEdge(
    id: string,
    source: string,
    sourceOrient: '+' | '-',
    target: string,
    targetOrient: '+' | '-',
    overlap: string,
  ): AssemblyEdge {
    return { id, source, target, sourceOrient, targetOrient, overlap, tags: {}, raw: id };
  }

  it('groups reciprocal pairs together', () => {
    const groups = deduplicateReciprocalLinks([
      buildEdge('L1', 'A', '+', 'B', '+', '100M'),
      buildEdge('L2', 'B', '-', 'A', '-', '100M'),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].representative.id).toBe('L1');
    expect(groups[0].members.map((member) => member.id)).toEqual(['L1', 'L2']);
  });

  it('keeps distinct orientation links separate', () => {
    const groups = deduplicateReciprocalLinks([
      buildEdge('L1', 'A', '+', 'B', '+', '100M'),
      buildEdge('L2', 'A', '+', 'B', '-', '100M'),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('keeps different overlap groups separate', () => {
    const groups = deduplicateReciprocalLinks([
      buildEdge('L1', 'A', '+', 'B', '+', '100M'),
      buildEdge('L2', 'B', '-', 'A', '-', '100M'),
      buildEdge('L3', 'A', '+', 'B', '+', '200M'),
      buildEdge('L4', 'B', '-', 'A', '-', '200M'),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('keeps repeated non-reciprocal directed links separate', () => {
    const groups = deduplicateReciprocalLinks([
      buildEdge('L1', 'A', '+', 'B', '+', '100M'),
      buildEdge('L2', 'A', '+', 'B', '+', '100M'),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.members.length === 1)).toBe(true);
  });

  it('deduplicates reciprocal self-loop duplicates', () => {
    const groups = deduplicateReciprocalLinks([
      buildEdge('L1', 'A', '+', 'A', '-', '100M'),
      buildEdge('L2', 'A', '+', 'A', '-', '100M'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(2);
  });
});
