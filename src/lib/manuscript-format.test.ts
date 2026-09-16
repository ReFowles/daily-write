import { describe, expect, it } from "vitest";
import {
  buildBoldPreservationRequests,
  buildDefaultFormatRequests,
  buildManuscriptFormatRequests,
  buildManuscriptHeadingRequests,
  computeBodyEndIndex,
  detectManuscriptFormat,
  SMF_DOCUMENT_STYLE,
  SMF_PARAGRAPH_STYLE,
  SMF_TEXT_STYLE,
  type RawDocumentForDetection,
} from "./manuscript-format";

const smfMatchingDoc: RawDocumentForDetection = {
  documentStyle: SMF_DOCUMENT_STYLE,
  body: {
    content: [
      {
        startIndex: 1,
        endIndex: 12,
        paragraph: {
          paragraphStyle: SMF_PARAGRAPH_STYLE,
          elements: [
            {
              textRun: {
                textStyle: SMF_TEXT_STYLE,
              },
            },
          ],
        },
      },
    ],
  },
};

describe("detectManuscriptFormat", () => {
  it("returns true when documentStyle, paragraphStyle, and textStyle all match SMF", () => {
    expect(detectManuscriptFormat(smfMatchingDoc)).toBe(true);
  });

  it("returns false when the font family is wrong", () => {
    const doc = structuredClone(smfMatchingDoc);
    const paragraph = doc.body!.content![0]!.paragraph!;
    paragraph.elements![0]!.textRun!.textStyle!.weightedFontFamily = {
      fontFamily: "Arial",
      weight: 400,
    };
    expect(detectManuscriptFormat(doc)).toBe(false);
  });

  it("returns false when line spacing is not 200", () => {
    const doc = structuredClone(smfMatchingDoc);
    doc.body!.content![0]!.paragraph!.paragraphStyle!.lineSpacing = 100;
    expect(detectManuscriptFormat(doc)).toBe(false);
  });

  it("returns false when margins are not 1 inch", () => {
    const doc = structuredClone(smfMatchingDoc);
    doc.documentStyle!.marginLeft = { magnitude: 36, unit: "PT" };
    expect(detectManuscriptFormat(doc)).toBe(false);
  });

  it("returns false when the body has no paragraphs", () => {
    const doc: RawDocumentForDetection = {
      documentStyle: SMF_DOCUMENT_STYLE,
      body: { content: [] },
    };
    expect(detectManuscriptFormat(doc)).toBe(false);
  });

  it("scopes detection to the requested tab when tabs are present", () => {
    const doc: RawDocumentForDetection = {
      documentStyle: SMF_DOCUMENT_STYLE,
      tabs: [
        {
          tabProperties: { tabId: "wrong" },
          documentTab: {
            body: {
              content: [
                {
                  endIndex: 5,
                  paragraph: {
                    paragraphStyle: SMF_PARAGRAPH_STYLE,
                    elements: [
                      { textRun: { textStyle: { weightedFontFamily: { fontFamily: "Arial", weight: 400 } } } },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          tabProperties: { tabId: "right" },
          documentTab: smfMatchingDoc.body ? { body: smfMatchingDoc.body } : undefined,
        },
      ],
    };
    expect(detectManuscriptFormat(doc, "right")).toBe(true);
    expect(detectManuscriptFormat(doc, "wrong")).toBe(false);
  });
});

describe("computeBodyEndIndex", () => {
  it("returns 1 for an empty body", () => {
    expect(computeBodyEndIndex({ body: { content: [] } })).toBe(1);
  });

  it("returns the last structural element's endIndex", () => {
    expect(
      computeBodyEndIndex({
        body: {
          content: [
            { startIndex: 1, endIndex: 10, paragraph: { elements: [] } },
            { startIndex: 10, endIndex: 42, paragraph: { elements: [] } },
          ],
        },
      })
    ).toBe(42);
  });
});

describe("buildManuscriptFormatRequests", () => {
  it("emits updateDocumentStyle, updateParagraphStyle, and updateTextStyle with SMF values", () => {
    const requests = buildManuscriptFormatRequests({ bodyEndIndex: 100 }) as Array<
      Record<string, Record<string, unknown>>
    >;

    expect(requests).toHaveLength(3);
    expect(requests[0].updateDocumentStyle).toBeDefined();
    const docStyle = requests[0].updateDocumentStyle as {
      documentStyle: typeof SMF_DOCUMENT_STYLE;
    };
    expect(docStyle.documentStyle.marginTop).toEqual({ magnitude: 72, unit: "PT" });

    const paraReq = requests[1].updateParagraphStyle as {
      range: { startIndex: number; endIndex: number };
      paragraphStyle: typeof SMF_PARAGRAPH_STYLE;
      fields: string;
    };
    expect(paraReq.range).toEqual({ startIndex: 1, endIndex: 99 });
    expect(paraReq.paragraphStyle.lineSpacing).toBe(200);
    expect(paraReq.paragraphStyle.indentFirstLine).toEqual({ magnitude: 36, unit: "PT" });
    expect(paraReq.paragraphStyle.alignment).toBe("START");
    // Fields must not include bold/italic/underline so those marks survive.
    expect(paraReq.fields).not.toMatch(/bold|italic|underline/);

    const textReq = requests[2].updateTextStyle as {
      textStyle: { weightedFontFamily: { fontFamily: string } };
      fields: string;
    };
    expect(textReq.textStyle.weightedFontFamily.fontFamily).toBe("Times New Roman");
    expect(textReq.fields).not.toMatch(/bold|italic|underline|strikethrough/);
  });

  it("places tabId inside updateDocumentStyle and inside the range for range-based requests", () => {
    const requests = buildManuscriptFormatRequests({ bodyEndIndex: 10, tabId: "t1" }) as Array<
      Record<string, Record<string, unknown>>
    >;

    const docStyleReq = requests[0].updateDocumentStyle as { tabId?: string };
    expect(docStyleReq.tabId).toBe("t1");

    const paraReq = requests[1].updateParagraphStyle as {
      range: { tabId?: string };
    };
    expect(paraReq.range.tabId).toBe("t1");

    const textReq = requests[2].updateTextStyle as {
      range: { tabId?: string };
    };
    expect(textReq.range.tabId).toBe("t1");
  });
});

describe("buildDefaultFormatRequests", () => {
  it("emits Google Docs defaults (Arial 11, single spaced, no indent)", () => {
    const requests = buildDefaultFormatRequests({ bodyEndIndex: 5 }) as Array<
      Record<string, Record<string, unknown>>
    >;

    const paraReq = requests[1].updateParagraphStyle as {
      paragraphStyle: { lineSpacing: number; indentFirstLine: { magnitude: number } };
    };
    expect(paraReq.paragraphStyle.lineSpacing).toBe(100);
    expect(paraReq.paragraphStyle.indentFirstLine.magnitude).toBe(0);

    const textReq = requests[2].updateTextStyle as {
      textStyle: {
        weightedFontFamily: { fontFamily: string };
        fontSize: { magnitude: number };
      };
    };
    expect(textReq.textStyle.weightedFontFamily.fontFamily).toBe("Arial");
    expect(textReq.textStyle.fontSize.magnitude).toBe(11);
  });
});

describe("buildBoldPreservationRequests", () => {
  interface UpdateTextStyleRequest {
    updateTextStyle: {
      range: { startIndex: number; endIndex: number; tabId?: string };
      textStyle: { bold?: boolean; weightedFontFamily?: { fontFamily: string; weight: number } };
      fields: string;
    };
  }

  const boldViaFlag: RawDocumentForDetection = {
    body: {
      content: [
        {
          startIndex: 1,
          endIndex: 10,
          paragraph: {
            elements: [
              { startIndex: 1, endIndex: 5, textRun: { textStyle: { bold: true } } },
              { startIndex: 5, endIndex: 10, textRun: { textStyle: { bold: false } } },
            ],
          },
        },
      ],
    },
  };

  it("re-asserts bold on runs flagged bold, in the target font at weight 700", () => {
    const requests = buildBoldPreservationRequests(
      boldViaFlag,
      "Times New Roman"
    ) as UpdateTextStyleRequest[];

    expect(requests).toHaveLength(1);
    const req = requests[0].updateTextStyle;
    expect(req.range).toEqual({ startIndex: 1, endIndex: 5 });
    expect(req.textStyle.bold).toBe(true);
    expect(req.textStyle.weightedFontFamily).toEqual({
      fontFamily: "Times New Roman",
      weight: 700,
    });
    expect(req.fields).toBe("bold,weightedFontFamily");
  });

  it("treats a weightedFontFamily weight >= 700 as bold even without the bold flag", () => {
    const doc: RawDocumentForDetection = {
      body: {
        content: [
          {
            startIndex: 1,
            endIndex: 6,
            paragraph: {
              elements: [
                {
                  startIndex: 1,
                  endIndex: 6,
                  textRun: {
                    textStyle: { weightedFontFamily: { fontFamily: "Georgia", weight: 700 } },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    const requests = buildBoldPreservationRequests(doc, "Arial") as UpdateTextStyleRequest[];
    expect(requests).toHaveLength(1);
    expect(requests[0].updateTextStyle.range).toEqual({ startIndex: 1, endIndex: 6 });
  });

  it("returns no requests when nothing is bold", () => {
    const doc: RawDocumentForDetection = {
      body: {
        content: [
          {
            startIndex: 1,
            endIndex: 5,
            paragraph: {
              elements: [{ startIndex: 1, endIndex: 5, textRun: { textStyle: {} } }],
            },
          },
        ],
      },
    };
    expect(buildBoldPreservationRequests(doc, "Arial")).toHaveLength(0);
  });

  it("scopes ranges to the given tab", () => {
    const requests = buildBoldPreservationRequests(
      boldViaFlag,
      "Times New Roman",
      "tab-1"
    ) as UpdateTextStyleRequest[];
    expect(requests[0].updateTextStyle.range.tabId).toBe("tab-1");
  });
});

describe("buildManuscriptHeadingRequests", () => {
  interface UpdateParagraphStyleRequest {
    updateParagraphStyle: {
      range: { startIndex: number; endIndex: number; tabId?: string };
      paragraphStyle: {
        alignment?: string;
        indentFirstLine?: { magnitude: number };
        spaceAbove?: { magnitude: number };
        pageBreakBefore?: boolean;
      };
      fields: string;
    };
  }

  type ContentElement = NonNullable<
    NonNullable<RawDocumentForDetection["body"]>["content"]
  >[number];

  function para(startIndex: number, endIndex: number, namedStyleType?: string): ContentElement {
    return {
      startIndex,
      endIndex,
      paragraph: {
        paragraphStyle: namedStyleType ? { namedStyleType } : {},
        elements: [{ startIndex, endIndex, textRun: { textStyle: {} } }],
      },
    };
  }

  it("centers headings and removes their first-line indent", () => {
    const doc: RawDocumentForDetection = {
      body: {
        content: [
          para(1, 10, "NORMAL_TEXT"),
          para(10, 20, "HEADING_2"),
        ],
      },
    };

    const requests = buildManuscriptHeadingRequests(doc) as UpdateParagraphStyleRequest[];
    expect(requests).toHaveLength(1);
    const req = requests[0].updateParagraphStyle;
    expect(req.range).toEqual({ startIndex: 10, endIndex: 20 });
    expect(req.paragraphStyle.alignment).toBe("CENTER");
    expect(req.paragraphStyle.indentFirstLine?.magnitude).toBe(0);
    // Non-chapter headings don't get a page break or drop-down.
    expect(req.paragraphStyle.pageBreakBefore).toBeUndefined();
    expect(req.paragraphStyle.spaceAbove).toBeUndefined();
    expect(req.fields).toBe("alignment,indentFirstLine");
  });

  it("gives a chapter (H1) heading a page break and drop-down when it isn't first", () => {
    const doc: RawDocumentForDetection = {
      body: {
        content: [
          para(1, 10, "NORMAL_TEXT"),
          para(10, 20, "HEADING_1"),
        ],
      },
    };

    const requests = buildManuscriptHeadingRequests(doc) as UpdateParagraphStyleRequest[];
    expect(requests).toHaveLength(1);
    const style = requests[0].updateParagraphStyle.paragraphStyle;
    expect(style.alignment).toBe("CENTER");
    expect(style.pageBreakBefore).toBe(true);
    expect(style.spaceAbove?.magnitude).toBeGreaterThan(0);
    expect(requests[0].updateParagraphStyle.fields).toContain("pageBreakBefore");
    expect(requests[0].updateParagraphStyle.fields).toContain("spaceAbove");
  });

  it("does not page-break a chapter heading that is the first paragraph", () => {
    const doc: RawDocumentForDetection = {
      body: { content: [para(1, 12, "HEADING_1")] },
    };

    const requests = buildManuscriptHeadingRequests(doc) as UpdateParagraphStyleRequest[];
    expect(requests).toHaveLength(1);
    const style = requests[0].updateParagraphStyle.paragraphStyle;
    // Still dropped down, but no page break (would leave a blank first page).
    expect(style.spaceAbove?.magnitude).toBeGreaterThan(0);
    expect(style.pageBreakBefore).toBeUndefined();
  });

  it("scopes ranges to the given tab", () => {
    const doc: RawDocumentForDetection = {
      body: { content: [para(1, 10, "HEADING_2")] },
    };
    const requests = buildManuscriptHeadingRequests(doc, "tab-9") as UpdateParagraphStyleRequest[];
    expect(requests[0].updateParagraphStyle.range.tabId).toBe("tab-9");
  });

  it("returns nothing when there are no headings", () => {
    const doc: RawDocumentForDetection = {
      body: { content: [para(1, 10, "NORMAL_TEXT")] },
    };
    expect(buildManuscriptHeadingRequests(doc)).toHaveLength(0);
  });
});
