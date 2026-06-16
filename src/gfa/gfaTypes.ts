export type Orientation = '+' | '-';

export interface GfaTag {
  name: string;
  type: string;
  value: string;
}

export interface GfaHeader {
  type: 'H';
  rawLine: string;
  tags: GfaTag[];
}

export interface GfaSegment {
  type: 'S';
  name: string;
  sequence: string;
  rawLine: string;
  tags: GfaTag[];
}

export interface GfaLink {
  type: 'L';
  from: string;
  fromOrient: Orientation;
  to: string;
  toOrient: Orientation;
  overlap: string;
  rawLine: string;
  tags: GfaTag[];
}

export interface GfaPath {
  type: 'P';
  name: string;
  segmentNames: string[];
  overlaps: string[];
  rawLine: string;
  tags: GfaTag[];
}

export interface GfaUnsupported {
  type: string;
  rawLine: string;
  lineNumber: number;
}

export interface ParsedGfa {
  header?: GfaHeader;
  segments: GfaSegment[];
  links: GfaLink[];
  paths: GfaPath[];
  unsupported: GfaUnsupported[];
  warnings: string[];
}
