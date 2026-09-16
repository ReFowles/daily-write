import { beforeEach, describe, expect, it, vi } from "vitest";

const { documentsGetMock, documentsBatchUpdateMock, docsMock, driveMock } = vi.hoisted(() => {
  const documentsGetMock = vi.fn();
  const documentsBatchUpdateMock = vi.fn();
  const docsMock = vi.fn(() => ({
    documents: { get: documentsGetMock, batchUpdate: documentsBatchUpdateMock },
  }));
  const driveMock = vi.fn();
  return { documentsGetMock, documentsBatchUpdateMock, docsMock, driveMock };
});

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function OAuth2() {
        return { setCredentials: vi.fn() };
      }),
    },
    docs: docsMock,
    drive: driveMock,
  },
}));

import { getGoogleDocContent, applyManuscriptFormat, removeManuscriptFormat } from "./google-docs";

describe("getGoogleDocContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts words from the single body when the doc has no tabs", async () => {
    documentsGetMock.mockResolvedValueOnce({
      data: {
        title: "Single Tab Doc",
        body: {
          content: [
            { paragraph: { elements: [{ textRun: { content: "hello world " } }] } },
          ],
        },
      },
    });

    const result = await getGoogleDocContent("token", "doc-1");

    expect(result.wordCount).toBe(2);
    expect(result.text).toBe("hello world ");
  });

  it("sums word counts across every tab, including nested child tabs", async () => {
    documentsGetMock.mockResolvedValueOnce({
      data: {
        title: "Multi Tab Doc",
        body: { content: [] },
        tabs: [
          {
            documentTab: {
              body: {
                content: [
                  { paragraph: { elements: [{ textRun: { content: "one two three " } }] } },
                ],
              },
            },
            childTabs: [
              {
                documentTab: {
                  body: {
                    content: [
                      { paragraph: { elements: [{ textRun: { content: "four five " } }] } },
                    ],
                  },
                },
              },
            ],
          },
          {
            documentTab: {
              body: {
                content: [
                  { paragraph: { elements: [{ textRun: { content: "six " } }] } },
                ],
              },
            },
          },
        ],
      },
    });

    const result = await getGoogleDocContent("token", "doc-2");

    expect(result.wordCount).toBe(6);
    expect(result.text).toBe("one two three four five six ");
    expect(documentsGetMock).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: "doc-2", includeTabsContent: true })
    );
  });
});

describe("applyManuscriptFormat / removeManuscriptFormat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const docWithBody = {
    data: {
      revisionId: "rev-1",
      body: {
        content: [
          { endIndex: 12, paragraph: { elements: [{ textRun: { content: "hello world" } }] } },
        ],
      },
    },
  };

  it("returns the post-update revisionId so callers can refresh their drift baseline", async () => {
    documentsGetMock
      .mockResolvedValueOnce(docWithBody) // initial read for bodyEndIndex
      .mockResolvedValueOnce({ data: { revisionId: "rev-2" } }); // post-update read
    documentsBatchUpdateMock.mockResolvedValueOnce({});

    const revisionId = await applyManuscriptFormat("token", "doc-1", "tab-1");

    expect(documentsBatchUpdateMock).toHaveBeenCalledTimes(1);
    expect(revisionId).toBe("rev-2");
  });

  it("removeManuscriptFormat also returns the post-update revisionId", async () => {
    documentsGetMock
      .mockResolvedValueOnce(docWithBody)
      .mockResolvedValueOnce({ data: { revisionId: "rev-9" } });
    documentsBatchUpdateMock.mockResolvedValueOnce({});

    const revisionId = await removeManuscriptFormat("token", "doc-1");

    expect(revisionId).toBe("rev-9");
  });
});

