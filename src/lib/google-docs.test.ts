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

import {
  getGoogleDocContent,
  applyManuscriptFormat,
  removeManuscriptFormat,
  createDocumentTab,
  deleteDocumentTab,
  updateDocumentTab,
} from "./google-docs";

// getDocumentTabs reads tabs from a documents.get response; this builds one.
function tabsResponse(
  tabs: Array<{ tabId: string; title: string; index?: number }>,
  revisionId = "rev-tabs"
) {
  return {
    data: {
      revisionId,
      tabs: tabs.map((t) => ({
        tabProperties: { tabId: t.tabId, title: t.title, index: t.index ?? 0, nestingLevel: 0 },
      })),
    },
  };
}

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

describe("tab mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDocumentTab adds a sub-tab and resolves the newly-created tab by diffing IDs", async () => {
    documentsGetMock
      .mockResolvedValueOnce(tabsResponse([{ tabId: "t1", title: "Chapter 1" }])) // before
      .mockResolvedValueOnce(
        tabsResponse([
          { tabId: "t1", title: "Chapter 1" },
          { tabId: "t2", title: "New sub-tab", index: 1 },
        ])
      ); // after
    documentsBatchUpdateMock.mockResolvedValueOnce({});

    const { tabs, created, revisionId } = await createDocumentTab("token", "doc-1", {
      title: "New sub-tab",
      parentTabId: "t1",
    });

    expect(documentsBatchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-1",
        requestBody: {
          requests: [
            { addDocumentTab: { tabProperties: { title: "New sub-tab", parentTabId: "t1" } } },
          ],
        },
      })
    );
    expect(tabs).toHaveLength(2);
    expect(created).toMatchObject({ tabId: "t2" });
    expect(revisionId).toBe("rev-tabs");
  });

  it("deleteDocumentTab sends a deleteTab request and returns the refreshed list", async () => {
    documentsBatchUpdateMock.mockResolvedValueOnce({});
    documentsGetMock.mockResolvedValueOnce(tabsResponse([{ tabId: "t1", title: "Chapter 1" }]));

    const { tabs } = await deleteDocumentTab("token", "doc-1", "t2");

    expect(documentsBatchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: { requests: [{ deleteTab: { tabId: "t2" } }] },
      })
    );
    expect(tabs).toEqual([
      expect.objectContaining({ tabId: "t1", title: "Chapter 1" }),
    ]);
  });

  it("updateDocumentTab builds a field mask from the supplied updates", async () => {
    documentsBatchUpdateMock.mockResolvedValueOnce({});
    documentsGetMock.mockResolvedValueOnce(tabsResponse([{ tabId: "t1", title: "Prologue" }]));

    await updateDocumentTab("token", "doc-1", "t1", { title: "Prologue" });

    expect(documentsBatchUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: {
          requests: [
            {
              updateDocumentTabProperties: {
                tabProperties: { tabId: "t1", title: "Prologue" },
                fields: "title",
              },
            },
          ],
        },
      })
    );
  });

  it("updateDocumentTab skips the batch update when there are no changes", async () => {
    documentsGetMock.mockResolvedValueOnce(tabsResponse([{ tabId: "t1", title: "Prologue" }]));

    await updateDocumentTab("token", "doc-1", "t1", {});

    expect(documentsBatchUpdateMock).not.toHaveBeenCalled();
  });
});

