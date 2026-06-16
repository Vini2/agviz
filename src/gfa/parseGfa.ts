import type {
  GfaTag,
  GfaHeader,
  GfaSegment,
  GfaLink,
  GfaPath,
  ParsedGfa,
  Orientation,
} from './gfaTypes';

function isOrientation(s: string): s is Orientation {
  return s === '+' || s === '-';
}

export function parseTags(fields: string[]): GfaTag[] {
  const tags: GfaTag[] = [];
  for (const field of fields) {
    const match = /^([A-Za-z][A-Za-z0-9]):([AifZJHB]):(.*)$/.exec(field);
    if (match) {
      tags.push({ name: match[1], type: match[2], value: match[3] });
    }
  }
  return tags;
}

export function tagListToObject(tags: GfaTag[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const tag of tags) {
    obj[tag.name] = tag.value;
  }
  return obj;
}

function parseHeader(fields: string[], rawLine: string): GfaHeader {
  return { type: 'H', rawLine, tags: parseTags(fields.slice(1)) };
}

function parseSegment(
  fields: string[],
  rawLine: string,
  lineNumber: number,
  warnings: string[],
): GfaSegment | null {
  if (fields.length < 3) {
    warnings.push(`Line ${lineNumber}: S record has fewer than 3 fields – skipping`);
    return null;
  }
  return {
    type: 'S',
    name: fields[1],
    sequence: fields[2],
    rawLine,
    tags: parseTags(fields.slice(3)),
  };
}

function parseLink(
  fields: string[],
  rawLine: string,
  lineNumber: number,
  warnings: string[],
): GfaLink | null {
  if (fields.length < 6) {
    warnings.push(`Line ${lineNumber}: L record has fewer than 6 fields – skipping`);
    return null;
  }
  const fromOrient = fields[2];
  const toOrient = fields[4];
  if (!isOrientation(fromOrient) || !isOrientation(toOrient)) {
    warnings.push(`Line ${lineNumber}: L record has invalid orientation – skipping`);
    return null;
  }
  return {
    type: 'L',
    from: fields[1],
    fromOrient,
    to: fields[3],
    toOrient,
    overlap: fields[5],
    rawLine,
    tags: parseTags(fields.slice(6)),
  };
}

function parsePath(
  fields: string[],
  rawLine: string,
  lineNumber: number,
  warnings: string[],
): GfaPath | null {
  if (fields.length < 3) {
    warnings.push(`Line ${lineNumber}: P record has fewer than 3 fields – skipping`);
    return null;
  }
  const segmentNames = fields[2].split(',');
  const overlaps = fields.length > 3 && fields[3] !== '*' ? fields[3].split(',') : [];
  return {
    type: 'P',
    name: fields[1],
    segmentNames,
    overlaps,
    rawLine,
    tags: parseTags(fields.slice(4)),
  };
}

export function parseGfa(text: string): ParsedGfa {
  const result: ParsedGfa = {
    segments: [],
    links: [],
    paths: [],
    unsupported: [],
    warnings: [],
  };

  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (line.trim() === '') continue;

    const fields = line.split('\t');
    const recordType = fields[0];

    switch (recordType) {
      case 'H': {
        result.header = parseHeader(fields, line);
        break;
      }
      case 'S': {
        const seg = parseSegment(fields, line, lineNumber, result.warnings);
        if (seg) result.segments.push(seg);
        break;
      }
      case 'L': {
        const link = parseLink(fields, line, lineNumber, result.warnings);
        if (link) result.links.push(link);
        break;
      }
      case 'P': {
        const path = parsePath(fields, line, lineNumber, result.warnings);
        if (path) result.paths.push(path);
        break;
      }
      default: {
        result.unsupported.push({ type: recordType, rawLine: line, lineNumber });
        result.warnings.push(
          `Line ${lineNumber}: unsupported record type '${recordType}' – stored but not visualised`,
        );
      }
    }
  }

  return result;
}
