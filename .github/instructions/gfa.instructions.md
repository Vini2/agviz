# GFA implementation instructions

Apply these instructions to files under `src/gfa/**`, `src/graph/**`, and related tests.

## GFA parser scope

Support GFA1-style records first:

- `H`: header
- `S`: segment
- `L`: link
- `P`: path

Store unsupported records with line numbers and raw content.

## Required parser behaviour

- Preserve raw line text.
- Preserve optional tags.
- Split records by tabs.
- Skip empty lines.
- Handle CRLF and LF newlines.
- Record warnings rather than failing on every minor issue.
- Throw only when the input is impossible to parse meaningfully.

## Tag parsing

Optional GFA tags have the shape:

```text
TAG:TYPE:VALUE
```

Examples:

```text
LN:i:12345
DP:f:12.4
KC:i:87
```

The parser should store tags faithfully. Biological interpretation belongs in graph transformation code.

## Segment interpretation

For `S` records:

```text
S<TAB>name<TAB>sequence<TAB>optional_tags...
```

Use:

- field 2 as segment ID;
- field 3 as sequence, possibly `*`;
- sequence length if sequence is not `*`;
- `LN:i` tag as length when sequence is `*` or when length needs confirmation.

## Link interpretation

For `L` records:

```text
L<TAB>from<TAB>fromOrient<TAB>to<TAB>toOrient<TAB>overlap<TAB>optional_tags...
```

Use these as edges in the internal graph.

## Coverage interpretation

Coverage is not standardised across all assemblers. Look for these tags in graph transformation code, in this approximate order:

- `DP`
- `KC`
- `RC`
- `FC`

Do not assume every graph has coverage.

## Tests

Use tiny deterministic fixtures. Do not require large real assemblies in unit tests.
