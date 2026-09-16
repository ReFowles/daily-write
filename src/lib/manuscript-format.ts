// Standard Manuscript Format (SMF) as accepted by agents, editors, and
// publishers: 8.5x11 US Letter, 1-inch margins, 12pt Times New Roman, double
// spaced, 0.5-inch first-line indent, no space above/below paragraphs,
// left-aligned (ragged right), black text on white.
//
// This module builds Google Docs `documents.batchUpdate` requests to apply
// SMF to a document, or to restore Google Docs' built-in defaults (Arial
// 11pt, single-spaced, 1-inch margins, no indent, left-aligned), and detects
// whether a fetched document already matches SMF exactly.

const PT_PER_INCH = 72;
const LETTER_WIDTH_PT = 8.5 * PT_PER_INCH; // 612
const LETTER_HEIGHT_PT = 11 * PT_PER_INCH; // 792
const ONE_INCH_PT = PT_PER_INCH; // 72
const HALF_INCH_PT = 0.5 * PT_PER_INCH; // 36

const BLACK_RGB = { red: 0, green: 0, blue: 0 };
const WHITE_RGB = { red: 1, green: 1, blue: 1 };

// Regular (non-bold) weight in the Google Docs API.
const REGULAR_WEIGHT = 400;

// Percent representation used by the Docs API. 200 = double spacing.
const SMF_LINE_SPACING = 200;
const DEFAULT_LINE_SPACING = 100;

// Field masks for updateTextStyle. We intentionally omit bold/italic/
// underline/strikethrough so existing character emphasis is preserved.
const TEXT_STYLE_FIELDS = "weightedFontFamily,fontSize,foregroundColor,backgroundColor";

// Field mask for updateParagraphStyle. We overwrite paragraph geometry
// (spacing, indent, alignment) but leave namedStyleType alone so headings
// remain headings if the user had any.
const PARAGRAPH_STYLE_FIELDS =
  "lineSpacing,spaceAbove,spaceBelow,indentFirstLine,indentStart,indentEnd,alignment";

// Field mask for updateDocumentStyle covering page size and margins.
const DOCUMENT_STYLE_FIELDS =
  "pageSize,marginTop,marginBottom,marginLeft,marginRight,background";

interface DimensionPt {
  magnitude: number;
  unit: "PT";
}

const pt = (magnitude: number): DimensionPt => ({ magnitude, unit: "PT" });

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const rgbColor = (rgb: RgbColor) => ({ color: { rgbColor: rgb } });

export interface SmfDocumentStyle {
  pageSize: { width: DimensionPt; height: DimensionPt };
  marginTop: DimensionPt;
  marginBottom: DimensionPt;
  marginLeft: DimensionPt;
  marginRight: DimensionPt;
  background: { color: { color: { rgbColor: RgbColor } } };
}

export interface SmfParagraphStyle {
  lineSpacing: number;
  spaceAbove: DimensionPt;
  spaceBelow: DimensionPt;
  indentFirstLine: DimensionPt;
  indentStart: DimensionPt;
  indentEnd: DimensionPt;
  alignment: "START" | "CENTER" | "END" | "JUSTIFIED";
}

export interface SmfTextStyle {
  weightedFontFamily: { fontFamily: string; weight: number };
  fontSize: DimensionPt;
  foregroundColor: ReturnType<typeof rgbColor>;
  backgroundColor: ReturnType<typeof rgbColor>;
}

export const SMF_DOCUMENT_STYLE: SmfDocumentStyle = {
  pageSize: { width: pt(LETTER_WIDTH_PT), height: pt(LETTER_HEIGHT_PT) },
  marginTop: pt(ONE_INCH_PT),
  marginBottom: pt(ONE_INCH_PT),
  marginLeft: pt(ONE_INCH_PT),
  marginRight: pt(ONE_INCH_PT),
  background: { color: { color: { rgbColor: WHITE_RGB } } },
};

export const SMF_PARAGRAPH_STYLE: SmfParagraphStyle = {
  lineSpacing: SMF_LINE_SPACING,
  spaceAbove: pt(0),
  spaceBelow: pt(0),
  indentFirstLine: pt(HALF_INCH_PT),
  indentStart: pt(0),
  indentEnd: pt(0),
  alignment: "START",
};

export const SMF_TEXT_STYLE: SmfTextStyle = {
  weightedFontFamily: { fontFamily: "Times New Roman", weight: REGULAR_WEIGHT },
  fontSize: pt(12),
  foregroundColor: rgbColor(BLACK_RGB),
  backgroundColor: rgbColor(WHITE_RGB),
};

const DEFAULT_DOCUMENT_STYLE: SmfDocumentStyle = {
  pageSize: { width: pt(LETTER_WIDTH_PT), height: pt(LETTER_HEIGHT_PT) },
  marginTop: pt(ONE_INCH_PT),
  marginBottom: pt(ONE_INCH_PT),
  marginLeft: pt(ONE_INCH_PT),
  marginRight: pt(ONE_INCH_PT),
  background: { color: { color: { rgbColor: WHITE_RGB } } },
};

const DEFAULT_PARAGRAPH_STYLE: SmfParagraphStyle = {
  lineSpacing: DEFAULT_LINE_SPACING,
  spaceAbove: pt(0),
  spaceBelow: pt(0),
  indentFirstLine: pt(0),
  indentStart: pt(0),
  indentEnd: pt(0),
  alignment: "START",
};

const DEFAULT_TEXT_STYLE: SmfTextStyle = {
  weightedFontFamily: { fontFamily: "Arial", weight: REGULAR_WEIGHT },
  fontSize: pt(11),
  foregroundColor: rgbColor(BLACK_RGB),
  backgroundColor: rgbColor(WHITE_RGB),
};

// Weight Google Docs uses for bold text. `bold: true` is equivalent to setting
// the font weight to 700, so the blanket SMF/default text style (weight 400)
// visually flattens bold unless we re-assert it on the runs that had it.
const BOLD_WEIGHT = 700;

// SMF chapter titles start a fresh page with the title dropped roughly a third
// of the way down. Applied as space above the (page-broken) heading paragraph.
const CHAPTER_TITLE_SPACE_ABOVE = pt(2 * PT_PER_INCH);

export const SMF_FONT_FAMILY = SMF_TEXT_STYLE.weightedFontFamily.fontFamily;
export const DEFAULT_FONT_FAMILY = DEFAULT_TEXT_STYLE.weightedFontFamily.fontFamily;

function withTab<T extends Record<string, unknown>>(obj: T, tabId?: string): T {
  return tabId ? { ...obj, tabId } : obj;
}

interface BuildRequestsOptions {
  bodyEndIndex: number;
  tabId?: string;
}

function buildBatchRequests(
  documentStyle: SmfDocumentStyle,
  paragraphStyle: SmfParagraphStyle,
  textStyle: SmfTextStyle,
  { bodyEndIndex, tabId }: BuildRequestsOptions
): object[] {
  // Body content lives between index 1 and bodyEndIndex. The final newline
  // sentinel makes bodyEndIndex the segment length; we operate up to
  // bodyEndIndex - 1 to stay within the body segment.
  const rangeEnd = Math.max(bodyEndIndex - 1, 1);
  const range = withTab({ startIndex: 1, endIndex: rangeEnd }, tabId);

  return [
    {
      updateDocumentStyle: withTab(
        {
          documentStyle,
          fields: DOCUMENT_STYLE_FIELDS,
        },
        tabId
      ),
    },
    {
      updateParagraphStyle: {
        range,
        paragraphStyle,
        fields: PARAGRAPH_STYLE_FIELDS,
      },
    },
    {
      updateTextStyle: {
        range,
        textStyle,
        fields: TEXT_STYLE_FIELDS,
      },
    },
  ];
}

export function buildManuscriptFormatRequests(options: BuildRequestsOptions): object[] {
  return buildBatchRequests(
    SMF_DOCUMENT_STYLE,
    SMF_PARAGRAPH_STYLE,
    SMF_TEXT_STYLE,
    options
  );
}

export function buildDefaultFormatRequests(options: BuildRequestsOptions): object[] {
  return buildBatchRequests(
    DEFAULT_DOCUMENT_STYLE,
    DEFAULT_PARAGRAPH_STYLE,
    DEFAULT_TEXT_STYLE,
    options
  );
}

// The blanket text-style update forces weight 400 across the whole range, which
// flattens bold (Google Docs renders bold via font weight). These follow-up
// requests re-assert bold on the runs that had it, in the target font family,
// so applying/restoring a format preserves emphasis. Must run AFTER the blanket
// text style so they win.
export function buildBoldPreservationRequests(
  doc: RawDocumentForDetection,
  fontFamily: string,
  tabId?: string
): object[] {
  const body = resolveBody(doc, tabId);
  const requests: object[] = [];
  for (const el of body?.content ?? []) {
    for (const elem of el.paragraph?.elements ?? []) {
      const style = elem.textRun?.textStyle;
      if (!style) continue;
      const isBold =
        style.bold === true ||
        (typeof style.weightedFontFamily?.weight === "number" &&
          style.weightedFontFamily.weight >= BOLD_WEIGHT);
      if (!isBold) continue;
      const startIndex = elem.startIndex;
      const endIndex = elem.endIndex;
      if (typeof startIndex !== "number" || typeof endIndex !== "number") continue;
      if (endIndex <= startIndex) continue;
      requests.push({
        updateTextStyle: {
          range: withTab({ startIndex, endIndex }, tabId),
          textStyle: {
            bold: true,
            weightedFontFamily: { fontFamily, weight: BOLD_WEIGHT },
          },
          fields: "bold,weightedFontFamily",
        },
      });
    }
  }
  return requests;
}

function headingLevelFromNamedStyle(named: string | null | undefined): number | null {
  if (!named) return null;
  const match = /^HEADING_([1-6])$/.exec(named);
  return match ? Number(match[1]) : null;
}

// SMF has no styled headings, but chapter/section titles are centered with no
// first-line indent, and chapter breaks (top-level headings) start a fresh page
// with the title dropped down. Emitted only for Apply SMF and run AFTER the
// blanket paragraph style so these overrides win. The first paragraph never
// gets a page break (that would leave a blank opening page).
export function buildManuscriptHeadingRequests(
  doc: RawDocumentForDetection,
  tabId?: string
): object[] {
  const body = resolveBody(doc, tabId);
  const requests: object[] = [];
  let seenParagraph = false;
  for (const el of body?.content ?? []) {
    const paragraph = el.paragraph;
    if (!paragraph) continue;
    const isFirstParagraph = !seenParagraph;
    seenParagraph = true;

    const level = headingLevelFromNamedStyle(paragraph.paragraphStyle?.namedStyleType);
    if (level === null) continue;

    const startIndex = el.startIndex;
    const endIndex = el.endIndex;
    if (typeof startIndex !== "number" || typeof endIndex !== "number") continue;
    if (endIndex <= startIndex) continue;

    const paragraphStyle: Record<string, unknown> = {
      alignment: "CENTER",
      indentFirstLine: pt(0),
    };
    const fields = ["alignment", "indentFirstLine"];

    // Chapter-level headings begin a new page with the title dropped down.
    if (level === 1) {
      paragraphStyle.spaceAbove = CHAPTER_TITLE_SPACE_ABOVE;
      fields.push("spaceAbove");
      if (!isFirstParagraph) {
        paragraphStyle.pageBreakBefore = true;
        fields.push("pageBreakBefore");
      }
    }

    requests.push({
      updateParagraphStyle: {
        range: withTab({ startIndex, endIndex }, tabId),
        paragraphStyle,
        fields: fields.join(","),
      },
    });
  }
  return requests;
}

// ---------- detection ----------

// Google Docs sends dimensions back as `{ magnitude, unit }`. We tolerate
// tiny floating-point drift because the API round-trips these values.
const EPSILON = 0.01;

interface RawDimension {
  magnitude?: number | null;
  unit?: string | null;
}

function dimensionEquals(actual: RawDimension | null | undefined, expected: DimensionPt): boolean {
  if (!actual) return false;
  if (actual.unit !== expected.unit) return false;
  const mag = typeof actual.magnitude === "number" ? actual.magnitude : 0;
  return Math.abs(mag - expected.magnitude) < EPSILON;
}

interface RawRgbColor {
  red?: number | null;
  green?: number | null;
  blue?: number | null;
}

function rgbEquals(actual: RawRgbColor | null | undefined, expected: RgbColor): boolean {
  if (!actual) return false;
  const r = typeof actual.red === "number" ? actual.red : 0;
  const g = typeof actual.green === "number" ? actual.green : 0;
  const b = typeof actual.blue === "number" ? actual.blue : 0;
  return (
    Math.abs(r - expected.red) < EPSILON &&
    Math.abs(g - expected.green) < EPSILON &&
    Math.abs(b - expected.blue) < EPSILON
  );
}

interface RawColorWrapper {
  color?: { rgbColor?: RawRgbColor | null } | null;
}

function colorEquals(actual: RawColorWrapper | null | undefined, expected: RgbColor): boolean {
  return rgbEquals(actual?.color?.rgbColor, expected);
}

interface RawDocumentStyle {
  pageSize?: { width?: RawDimension | null; height?: RawDimension | null } | null;
  marginTop?: RawDimension | null;
  marginBottom?: RawDimension | null;
  marginLeft?: RawDimension | null;
  marginRight?: RawDimension | null;
  background?: { color?: RawColorWrapper | null } | null;
}

function documentStyleMatchesSmf(style: RawDocumentStyle | null | undefined): boolean {
  if (!style) return false;
  if (!dimensionEquals(style.pageSize?.width, SMF_DOCUMENT_STYLE.pageSize.width)) return false;
  if (!dimensionEquals(style.pageSize?.height, SMF_DOCUMENT_STYLE.pageSize.height)) return false;
  if (!dimensionEquals(style.marginTop, SMF_DOCUMENT_STYLE.marginTop)) return false;
  if (!dimensionEquals(style.marginBottom, SMF_DOCUMENT_STYLE.marginBottom)) return false;
  if (!dimensionEquals(style.marginLeft, SMF_DOCUMENT_STYLE.marginLeft)) return false;
  if (!dimensionEquals(style.marginRight, SMF_DOCUMENT_STYLE.marginRight)) return false;
  // Background: if omitted the Docs default is white, which matches SMF.
  const bgWrapper = style.background?.color;
  if (bgWrapper && !colorEquals(bgWrapper, WHITE_RGB)) return false;
  return true;
}

interface RawParagraphStyle {
  namedStyleType?: string | null;
  lineSpacing?: number | null;
  spaceAbove?: RawDimension | null;
  spaceBelow?: RawDimension | null;
  indentFirstLine?: RawDimension | null;
  indentStart?: RawDimension | null;
  indentEnd?: RawDimension | null;
  alignment?: string | null;
}

// Empty-magnitude values (`{}` or missing) mean "use the named style default".
// For a fresh SMF-formatted doc every paragraph's style should have the
// explicit SMF values because we set them via updateParagraphStyle.
function paragraphStyleMatchesSmf(style: RawParagraphStyle | null | undefined): boolean {
  if (!style) return false;
  const spacing = typeof style.lineSpacing === "number" ? style.lineSpacing : 0;
  if (Math.abs(spacing - SMF_LINE_SPACING) > EPSILON) return false;
  if (!dimensionEquals(style.spaceAbove, SMF_PARAGRAPH_STYLE.spaceAbove)) return false;
  if (!dimensionEquals(style.spaceBelow, SMF_PARAGRAPH_STYLE.spaceBelow)) return false;
  if (!dimensionEquals(style.indentFirstLine, SMF_PARAGRAPH_STYLE.indentFirstLine)) return false;
  if (!dimensionEquals(style.indentStart, SMF_PARAGRAPH_STYLE.indentStart)) return false;
  if (!dimensionEquals(style.indentEnd, SMF_PARAGRAPH_STYLE.indentEnd)) return false;
  if ((style.alignment ?? "START") !== SMF_PARAGRAPH_STYLE.alignment) return false;
  return true;
}

interface RawTextStyle {
  bold?: boolean | null;
  weightedFontFamily?: { fontFamily?: string | null; weight?: number | null } | null;
  fontSize?: RawDimension | null;
  foregroundColor?: RawColorWrapper | null;
  backgroundColor?: RawColorWrapper | null;
}

function textStyleMatchesSmf(style: RawTextStyle | null | undefined): boolean {
  if (!style) return false;
  const family = style.weightedFontFamily?.fontFamily;
  if (family !== SMF_TEXT_STYLE.weightedFontFamily.fontFamily) return false;
  if (!dimensionEquals(style.fontSize, SMF_TEXT_STYLE.fontSize)) return false;
  if (!colorEquals(style.foregroundColor, BLACK_RGB)) return false;
  const bg = style.backgroundColor;
  if (bg?.color?.rgbColor && !colorEquals(bg, WHITE_RGB)) return false;
  return true;
}

interface RawParagraphElement {
  startIndex?: number | null;
  endIndex?: number | null;
  textRun?: { textStyle?: RawTextStyle | null } | null;
}

interface RawParagraph {
  paragraphStyle?: RawParagraphStyle | null;
  elements?: RawParagraphElement[] | null;
}

interface RawStructuralElement {
  startIndex?: number | null;
  endIndex?: number | null;
  paragraph?: RawParagraph | null;
  sectionBreak?: unknown;
  table?: unknown;
}

interface RawBody {
  content?: RawStructuralElement[] | null;
}

interface RawTabNode {
  documentTab?: { body?: RawBody | null } | null;
  childTabs?: RawTabNode[] | null;
  tabProperties?: { tabId?: string | null } | null;
}

export interface RawDocumentForDetection {
  documentStyle?: RawDocumentStyle | null;
  body?: RawBody | null;
  tabs?: RawTabNode[] | null;
}

function findTabBody(tabs: RawTabNode[] | null | undefined, tabId?: string): RawBody | null {
  for (const tab of tabs ?? []) {
    if (!tabId || tab.tabProperties?.tabId === tabId) {
      const body = tab.documentTab?.body;
      if (body) return body;
    }
    const nested = findTabBody(tab.childTabs, tabId);
    if (nested) return nested;
  }
  return null;
}

// Resolves the body the caller wants to inspect. Mirrors the fallback used
// in google-docs-to-content: explicit tabId wins, otherwise the first tab,
// otherwise the top-level body.
function resolveBody(doc: RawDocumentForDetection, tabId?: string): RawBody | null {
  if (tabId) {
    const scoped = findTabBody(doc.tabs, tabId);
    if (scoped) return scoped;
  }
  if (doc.tabs && doc.tabs.length > 0) {
    const first = findTabBody(doc.tabs);
    if (first) return first;
  }
  return doc.body ?? null;
}

// Detects whether every paragraph in the (optionally tab-scoped) body and the
// document-level style match SMF exactly. Tables are ignored; if the doc has
// no paragraphs we return false so the toggle stays off for an unknown state.
export function detectManuscriptFormat(
  doc: RawDocumentForDetection,
  tabId?: string
): boolean {
  if (!documentStyleMatchesSmf(doc.documentStyle)) return false;

  const body = resolveBody(doc, tabId);

  const content = body?.content ?? [];
  let sawParagraph = false;
  for (const el of content) {
    const paragraph = el.paragraph;
    if (!paragraph) continue;
    sawParagraph = true;
    if (!paragraphStyleMatchesSmf(paragraph.paragraphStyle)) return false;
    for (const elem of paragraph.elements ?? []) {
      const textStyle = elem.textRun?.textStyle;
      if (!textStyle) continue;
      if (!textStyleMatchesSmf(textStyle)) return false;
    }
  }
  return sawParagraph;
}

// Reads the end index of the last structural element in the body so the
// caller can bound the updateParagraphStyle / updateTextStyle ranges.
// Falls back to 1 (an empty body) if nothing is present.
export function computeBodyEndIndex(
  doc: RawDocumentForDetection,
  tabId?: string
): number {
  const body = resolveBody(doc, tabId);
  const content = body?.content ?? [];
  for (let i = content.length - 1; i >= 0; i--) {
    const endIndex = content[i]?.endIndex;
    if (typeof endIndex === "number" && endIndex > 1) return endIndex;
  }
  return 1;
}
