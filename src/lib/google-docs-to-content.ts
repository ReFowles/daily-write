import type {
  BlockNode,
  BulletListNode,
  DocStyle,
  DocumentContent,
  HeadingLevel,
  InlineNode,
  ListItemNode,
  Mark,
  OrderedListNode,
  ParagraphNode,
  HeadingNode,
  TableNode,
  TableRowNode,
  TextNode,
} from './document-content';
import { isNonEmptyDocStyle } from './document-content';

// Minimal shape of the Google Docs API response that we actually consume. The
// googleapis types are broad and frequently out of date; we cast at the entry
// point instead of trying to keep them in sync.

interface DocsTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: { url?: string | null } | null;
  // Arbitrary preserved fields (weightedFontFamily, fontSize, foregroundColor, ...).
  [key: string]: unknown;
}

interface DocsTextRun {
  content?: string | null;
  textStyle?: DocsTextStyle | null;
}

interface DocsParagraphElement {
  textRun?: DocsTextRun | null;
}

interface DocsBullet {
  listId?: string | null;
  nestingLevel?: number | null;
}

interface DocsParagraphStyle {
  namedStyleType?: string | null;
  // Arbitrary preserved fields (lineSpacing, spaceAbove, indentFirstLine, ...).
  [key: string]: unknown;
}

interface DocsParagraph {
  elements?: DocsParagraphElement[] | null;
  paragraphStyle?: DocsParagraphStyle | null;
  bullet?: DocsBullet | null;
}

interface DocsTableCell {
  content?: DocsStructuralElement[] | null;
}

interface DocsTableRow {
  tableCells?: DocsTableCell[] | null;
}

interface DocsTable {
  tableRows?: DocsTableRow[] | null;
}

interface DocsStructuralElement {
  paragraph?: DocsParagraph | null;
  table?: DocsTable | null;
}

interface DocsBody {
  content?: DocsStructuralElement[] | null;
}

interface DocsNestingLevel {
  glyphType?: string | null;
  glyphSymbol?: string | null;
}

interface DocsListProperties {
  nestingLevels?: DocsNestingLevel[] | null;
}

interface DocsList {
  listProperties?: DocsListProperties | null;
}

interface DocsTab {
  tabProperties?: { tabId?: string | null } | null;
  documentTab?: {
    body?: DocsBody | null;
    lists?: Record<string, DocsList> | null;
  } | null;
  childTabs?: DocsTab[] | null;
}

export interface GoogleDocsDocument {
  body?: DocsBody | null;
  lists?: Record<string, DocsList> | null;
  tabs?: DocsTab[] | null;
}

const ORDERED_GLYPH_TYPES = new Set([
  'DECIMAL',
  'ZERO_DECIMAL',
  'UPPER_ALPHA',
  'ALPHA',
  'UPPER_ROMAN',
  'ROMAN',
]);

function findTargetContext(
  document: GoogleDocsDocument,
  tabId: string | undefined
): { body: DocsBody | null | undefined; lists: Record<string, DocsList> } {
  if (tabId && document.tabs) {
    const findTab = (tabs: DocsTab[]): DocsTab | undefined => {
      for (const tab of tabs) {
        if (tab.tabProperties?.tabId === tabId) return tab;
        if (tab.childTabs) {
          const found = findTab(tab.childTabs);
          if (found) return found;
        }
      }
      return undefined;
    };
    const target = findTab(document.tabs);
    if (target?.documentTab) {
      return {
        body: target.documentTab.body,
        lists: target.documentTab.lists ?? {},
      };
    }
  }

  if (document.tabs && document.tabs.length > 0) {
    const first = document.tabs[0];
    if (first.documentTab) {
      return {
        body: first.documentTab.body,
        lists: first.documentTab.lists ?? {},
      };
    }
  }

  return { body: document.body, lists: document.lists ?? {} };
}

function textStyleToMarks(style: DocsTextStyle | null | undefined): Mark[] {
  if (!style) return [];
  const marks: Mark[] = [];
  if (style.bold) marks.push({ type: 'bold' });
  if (style.italic) marks.push({ type: 'italic' });
  if (style.underline) marks.push({ type: 'underline' });
  if (style.strikethrough) marks.push({ type: 'strike' });
  if (style.link?.url) marks.push({ type: 'link', attrs: { href: style.link.url } });
  const preserved = extractPreservedTextStyle(style);
  if (preserved) marks.push({ type: 'docStyle', attrs: { style: preserved } });
  return marks;
}

// Fields the Google Docs response exposes that are safe to write back via
// updateTextStyle. Anything outside this list is dropped so we never echo
// output-only or oddly-shaped fields back and get the whole diff rejected.
const PRESERVED_TEXT_STYLE_FIELDS = new Set([
  'weightedFontFamily',
  'fontSize',
  'foregroundColor',
  'backgroundColor',
  'baselineOffset',
  'smallCaps',
]);

function extractPreservedTextStyle(style: DocsTextStyle): DocStyle | null {
  const preserved: DocStyle = {};
  for (const key of PRESERVED_TEXT_STYLE_FIELDS) {
    const value = style[key];
    if (value === undefined || value === null) continue;
    preserved[key] = value;
  }
  return isNonEmptyDocStyle(preserved) ? preserved : null;
}

// Same rationale for paragraphStyle. Border and tabStops fields are omitted;
// they round-trip poorly in practice and aren't relevant to the common preset
// use cases (font, spacing, indent, alignment).
const PRESERVED_PARAGRAPH_STYLE_FIELDS = new Set([
  'alignment',
  'lineSpacing',
  'direction',
  'spacingMode',
  'spaceAbove',
  'spaceBelow',
  'indentFirstLine',
  'indentStart',
  'indentEnd',
  'keepLinesTogether',
  'keepWithNext',
  'avoidWidowAndOrphan',
  'pageBreakBefore',
  'shading',
]);

function extractPreservedParagraphStyle(
  style: DocsParagraphStyle | null | undefined
): DocStyle | null {
  if (!style) return null;
  const preserved: DocStyle = {};
  for (const key of PRESERVED_PARAGRAPH_STYLE_FIELDS) {
    const value = style[key];
    if (value === undefined || value === null) continue;
    preserved[key] = value;
  }
  return isNonEmptyDocStyle(preserved) ? preserved : null;
}

function paragraphToInlines(paragraph: DocsParagraph): InlineNode[] {
  const inlines: InlineNode[] = [];
  for (const element of paragraph.elements ?? []) {
    const run = element.textRun;
    if (!run?.content) continue;
    // Google Docs stores a trailing newline on the last run of each paragraph;
    // the paragraph boundary is implicit in our block structure so we drop it.
    const text = run.content.replace(/\n$/, '');
    if (text.length === 0) continue;
    const marks = textStyleToMarks(run.textStyle);
    const node: TextNode = marks.length > 0
      ? { type: 'text', text, marks }
      : { type: 'text', text };
    inlines.push(node);
  }
  return inlines;
}

function headingLevelFromStyle(style: DocsParagraphStyle | null | undefined): HeadingLevel | null {
  const named = style?.namedStyleType;
  if (!named) return null;
  const match = /^HEADING_([1-6])$/.exec(named);
  if (!match) return null;
  const level = Number(match[1]);
  if (level >= 1 && level <= 3) return level as HeadingLevel;
  // Levels 4-6 collapse to H3 so the editor doesn't need to model deeper headings.
  return 3;
}

function paragraphToBlock(paragraph: DocsParagraph): ParagraphNode | HeadingNode {
  const level = headingLevelFromStyle(paragraph.paragraphStyle);
  const inlines = paragraphToInlines(paragraph);
  const preservedStyle = extractPreservedParagraphStyle(paragraph.paragraphStyle);
  if (level !== null) {
    const attrs: HeadingNode['attrs'] = { level };
    if (preservedStyle) attrs.docStyle = preservedStyle;
    return inlines.length > 0
      ? { type: 'heading', attrs, content: inlines }
      : { type: 'heading', attrs };
  }
  const attrs: ParagraphNode['attrs'] | undefined = preservedStyle
    ? { docStyle: preservedStyle }
    : undefined;
  const node: ParagraphNode = { type: 'paragraph' };
  if (attrs) node.attrs = attrs;
  if (inlines.length > 0) node.content = inlines;
  return node;
}

function isOrderedList(bullet: DocsBullet, lists: Record<string, DocsList>): boolean {
  if (!bullet.listId) return false;
  const list = lists[bullet.listId];
  const nestingLevel = bullet.nestingLevel ?? 0;
  const level = list?.listProperties?.nestingLevels?.[nestingLevel];
  const glyphType = level?.glyphType;
  return typeof glyphType === 'string' && ORDERED_GLYPH_TYPES.has(glyphType);
}

// Walks a run of consecutive bulleted paragraphs and produces a (possibly
// nested) bullet or ordered list. Uses the nestingLevel field on each
// paragraph.bullet to decide when to open or close a nested list.
function collectListFrom(
  elements: DocsStructuralElement[],
  startIndex: number,
  lists: Record<string, DocsList>
): { node: BulletListNode | OrderedListNode; consumed: number } {
  const firstBullet = elements[startIndex].paragraph!.bullet!;
  const listId = firstBullet.listId;
  const ordered = isOrderedList(firstBullet, lists);

  const items: ListItemNode[] = [];
  let index = startIndex;
  let currentItem: ListItemNode | null = null;

  const openItem = (paragraph: DocsParagraph): ListItemNode => {
    const item: ListItemNode = { type: 'listItem', content: [paragraphToBlock(paragraph)] };
    items.push(item);
    return item;
  };

  while (index < elements.length) {
    const paragraph = elements[index].paragraph;
    if (!paragraph?.bullet || paragraph.bullet.listId !== listId) break;

    const nestingLevel = paragraph.bullet.nestingLevel ?? 0;

    if (nestingLevel === 0 || currentItem === null) {
      currentItem = openItem(paragraph);
      index++;
      continue;
    }

    const nested = collectListFrom(elements, index, lists);
    const itemContent = currentItem.content ?? (currentItem.content = []);
    itemContent.push(nested.node);
    index += nested.consumed;
  }

  const node: BulletListNode | OrderedListNode = ordered
    ? { type: 'orderedList', content: items }
    : { type: 'bulletList', content: items };

  return { node, consumed: index - startIndex };
}

function tableToBlock(table: DocsTable): TableNode {
  const rows: TableRowNode[] = [];
  for (const row of table.tableRows ?? []) {
    const cells: TableRowNode['content'] = [];
    for (const cell of row.tableCells ?? []) {
      const cellBlocks = elementsToBlocks(cell.content ?? [], {});
      cells!.push({
        type: 'tableCell',
        content: cellBlocks.length > 0 ? cellBlocks : [{ type: 'paragraph' }],
      });
    }
    rows.push({ type: 'tableRow', content: cells });
  }
  return { type: 'table', content: rows };
}

function elementsToBlocks(
  elements: DocsStructuralElement[],
  lists: Record<string, DocsList>
): BlockNode[] {
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < elements.length) {
    const element = elements[i];

    if (element.paragraph?.bullet) {
      const { node, consumed } = collectListFrom(elements, i, lists);
      blocks.push(node);
      i += Math.max(consumed, 1);
      continue;
    }

    if (element.paragraph) {
      blocks.push(paragraphToBlock(element.paragraph));
      i++;
      continue;
    }

    if (element.table) {
      blocks.push(tableToBlock(element.table));
      i++;
      continue;
    }

    // sectionBreak, tableOfContents, and unknown elements are skipped.
    i++;
  }

  return blocks;
}

export function googleDocsToContent(
  document: GoogleDocsDocument,
  tabId?: string
): DocumentContent {
  const { body, lists } = findTargetContext(document, tabId);
  const blocks = elementsToBlocks(body?.content ?? [], lists);
  return {
    type: 'doc',
    content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
  };
}
