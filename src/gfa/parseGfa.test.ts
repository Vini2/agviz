import { describe, it, expect } from 'vitest';
import { parseGfa, parseTags, tagListToObject } from './parseGfa';

const TINY_GFA = `H\tVN:Z:1.0
S\tcontig1\tACGTACGT\tLN:i:8\tDP:f:12.4
S\tcontig2\tGGTTGGTT\tLN:i:8\tDP:f:8.1
L\tcontig1\t+\tcontig2\t-\t4M
`;

describe('parseTags', () => {
  it('parses integer tag', () => {
    const tags = parseTags(['LN:i:12345']);
    expect(tags).toEqual([{ name: 'LN', type: 'i', value: '12345' }]);
  });

  it('parses float tag', () => {
    const tags = parseTags(['DP:f:12.4']);
    expect(tags).toEqual([{ name: 'DP', type: 'f', value: '12.4' }]);
  });

  it('parses string tag', () => {
    const tags = parseTags(['VN:Z:1.0']);
    expect(tags).toEqual([{ name: 'VN', type: 'Z', value: '1.0' }]);
  });

  it('ignores non-tag fields', () => {
    const tags = parseTags(['notAtag', 'also:bad']);
    expect(tags).toHaveLength(0);
  });

  it('parses multiple tags', () => {
    const tags = parseTags(['LN:i:100', 'DP:f:5.0', 'RC:i:42']);
    expect(tags).toHaveLength(3);
  });
});

describe('tagListToObject', () => {
  it('converts tag array to object', () => {
    const tags = parseTags(['LN:i:100', 'DP:f:5.0']);
    const obj = tagListToObject(tags);
    expect(obj).toEqual({ LN: '100', DP: '5.0' });
  });
});

describe('parseGfa – minimal GFA', () => {
  it('parses header', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.header).toBeDefined();
    expect(result.header?.tags[0]).toEqual({ name: 'VN', type: 'Z', value: '1.0' });
  });

  it('parses two segments', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.segments).toHaveLength(2);
  });

  it('parses segment names', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.segments[0].name).toBe('contig1');
    expect(result.segments[1].name).toBe('contig2');
  });

  it('parses segment sequences', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.segments[0].sequence).toBe('ACGTACGT');
  });

  it('preserves raw lines on segments', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.segments[0].rawLine).toContain('contig1');
  });

  it('parses segment tags', () => {
    const result = parseGfa(TINY_GFA);
    const tags = tagListToObject(result.segments[0].tags);
    expect(tags['LN']).toBe('8');
    expect(tags['DP']).toBe('12.4');
  });

  it('parses one link', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.links).toHaveLength(1);
  });

  it('parses link fields', () => {
    const result = parseGfa(TINY_GFA);
    const link = result.links[0];
    expect(link.from).toBe('contig1');
    expect(link.fromOrient).toBe('+');
    expect(link.to).toBe('contig2');
    expect(link.toOrient).toBe('-');
    expect(link.overlap).toBe('4M');
  });

  it('preserves raw line on link', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.links[0].rawLine).toContain('contig1');
  });

  it('produces no warnings for valid GFA', () => {
    const result = parseGfa(TINY_GFA);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('parseGfa – S record with * sequence and LN tag', () => {
  it('parses * sequence correctly', () => {
    const gfa = 'S\tnode1\t*\tLN:i:1000\n';
    const result = parseGfa(gfa);
    expect(result.segments[0].sequence).toBe('*');
    expect(tagListToObject(result.segments[0].tags)['LN']).toBe('1000');
  });
});

describe('parseGfa – P records', () => {
  it('parses path records', () => {
    const gfa = 'P\tpath1\tcontig1+,contig2-\t4M\n';
    const result = parseGfa(gfa);
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0].name).toBe('path1');
    expect(result.paths[0].segmentNames).toEqual(['contig1+', 'contig2-']);
  });
});

describe('parseGfa – CRLF line endings', () => {
  it('handles Windows line endings', () => {
    const gfa = 'H\tVN:Z:1.0\r\nS\ta\t*\tLN:i:100\r\n';
    const result = parseGfa(gfa);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].name).toBe('a');
  });
});

describe('parseGfa – unsupported records', () => {
  it('stores unsupported records with warnings', () => {
    const gfa = 'X\tsomething\n';
    const result = parseGfa(gfa);
    expect(result.unsupported).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('X');
  });
});

describe('parseGfa – empty lines', () => {
  it('skips empty lines without warnings', () => {
    const gfa = '\nS\ta\tACGT\n\n';
    const result = parseGfa(gfa);
    expect(result.segments).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('parseGfa – malformed S record', () => {
  it('warns on S record with too few fields', () => {
    const gfa = 'S\tonlyone\n';
    const result = parseGfa(gfa);
    expect(result.segments).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('parseGfa – malformed L record', () => {
  it('warns on L record with too few fields', () => {
    const gfa = 'L\ta\t+\tb\n';
    const result = parseGfa(gfa);
    expect(result.links).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
  });
});
