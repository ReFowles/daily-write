import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/google-docs", async () => {
  const actual = await vi.importActual<typeof import("@/lib/google-docs")>("@/lib/google-docs");
  return {
    ...actual,
    listGoogleDocs: vi.fn(),
    getGoogleDocAsContent: vi.fn(),
    updateGoogleDocFromContent: vi.fn(),
    createGoogleDoc: vi.fn(),
    getDocumentTabs: vi.fn(),
    searchGoogleDocs: vi.fn(),
    getGoogleDocsByIds: vi.fn(),
  };
});

import { auth } from "@/lib/auth";
import {
  createGoogleDoc,
  getDocumentTabs,
  getGoogleDocAsContent,
  getGoogleDocsByIds,
  listGoogleDocs,
  searchGoogleDocs,
  updateGoogleDocFromContent,
  DocumentDriftError,
} from "@/lib/google-docs";
import { GET, POST, PUT } from "./route";
import type { DocumentContent } from "@/lib/document-content";

type MinimalSession = { accessToken: string } | null;

// NextAuth's `auth` is overloaded for middleware/pages/routes; narrow it for testing.
const authMock = vi.mocked(auth as unknown as () => Promise<MinimalSession>);
const listGoogleDocsMock = vi.mocked(listGoogleDocs);
const createGoogleDocMock = vi.mocked(createGoogleDoc);
const getDocumentTabsMock = vi.mocked(getDocumentTabs);
const getGoogleDocAsContentMock = vi.mocked(getGoogleDocAsContent);
const updateGoogleDocFromContentMock = vi.mocked(updateGoogleDocFromContent);
const searchGoogleDocsMock = vi.mocked(searchGoogleDocs);
const getGoogleDocsByIdsMock = vi.mocked(getGoogleDocsByIds);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/google-docs", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const authenticatedSession: MinimalSession = { accessToken: "test-token" };

const sampleContent: DocumentContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hello world!" }] }],
};

describe("google-docs API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 without a session access token", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await GET();
      expect(res.status).toBe(401);
      expect(listGoogleDocsMock).not.toHaveBeenCalled();
    });

    it("returns the doc list when authorized", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      listGoogleDocsMock.mockResolvedValueOnce([
        {
          id: "doc-1",
          name: "Test",
          modifiedTime: "2026-01-01T00:00:00Z",
          webViewLink: "https://example.com",
          ownedByMe: true,
        },
      ]);

      const res = await GET();
      expect(res.status).toBe(200);
      expect(listGoogleDocsMock).toHaveBeenCalledWith("test-token");
      await expect(res.json()).resolves.toEqual({
        docs: [
          {
            id: "doc-1",
            name: "Test",
            modifiedTime: "2026-01-01T00:00:00Z",
            webViewLink: "https://example.com",
            ownedByMe: true,
          },
        ],
      });
    });

    it("returns 500 when the docs service throws", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      listGoogleDocsMock.mockRejectedValueOnce(new Error("boom"));
      vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await GET();
      expect(res.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("returns 401 without a session access token", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await POST(makeRequest({ action: "create", title: "x" }));
      expect(res.status).toBe(401);
      expect(createGoogleDocMock).not.toHaveBeenCalled();
    });

    it("rejects create without a valid title", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await POST(makeRequest({ action: "create" }));
      expect(res.status).toBe(400);
      expect(createGoogleDocMock).not.toHaveBeenCalled();
    });

    it("creates a document when title is provided", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      createGoogleDocMock.mockResolvedValueOnce({
        id: "new",
        name: "My Doc",
        modifiedTime: "2026-01-01T00:00:00Z",
        webViewLink: "https://example.com",
        ownedByMe: true,
      });

      const res = await POST(makeRequest({ action: "create", title: "My Doc" }));
      expect(res.status).toBe(200);
      expect(createGoogleDocMock).toHaveBeenCalledWith("test-token", "My Doc");
    });

    it("rejects getTabs without documentId", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await POST(makeRequest({ action: "getTabs" }));
      expect(res.status).toBe(400);
      expect(getDocumentTabsMock).not.toHaveBeenCalled();
    });

    it("returns tabs when documentId is provided", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      getDocumentTabsMock.mockResolvedValueOnce([
        { tabId: "t1", title: "Tab 1", index: 0, nestingLevel: 0 },
      ]);

      const res = await POST(makeRequest({ action: "getTabs", documentId: "doc-1" }));
      expect(res.status).toBe(200);
      expect(getDocumentTabsMock).toHaveBeenCalledWith("test-token", "doc-1");
    });

    it("default action returns content and revisionId for the document", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      getGoogleDocAsContentMock.mockResolvedValueOnce({
        content: sampleContent,
        revisionId: "rev-abc",
      });

      const res = await POST(makeRequest({ documentId: "doc-1", tabId: "t1" }));
      expect(res.status).toBe(200);
      expect(getGoogleDocAsContentMock).toHaveBeenCalledWith("test-token", "doc-1", "t1");
      await expect(res.json()).resolves.toEqual({
        content: sampleContent,
        revisionId: "rev-abc",
      });
    });

    it("search rejects when query is missing", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await POST(makeRequest({ action: "search" }));
      expect(res.status).toBe(400);
      expect(searchGoogleDocsMock).not.toHaveBeenCalled();
    });

    it("search forwards the query and returns docs", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      searchGoogleDocsMock.mockResolvedValueOnce([
        {
          id: "s1",
          name: "Search Hit",
          modifiedTime: "2026-01-01T00:00:00Z",
          webViewLink: "https://example.com",
          ownedByMe: true,
        },
      ]);

      const res = await POST(makeRequest({ action: "search", query: "dragon" }));
      expect(res.status).toBe(200);
      expect(searchGoogleDocsMock).toHaveBeenCalledWith("test-token", "dragon");
      const body = (await res.json()) as { docs: unknown[] };
      expect(body.docs).toHaveLength(1);
    });

    it("getByIds rejects a non-array ids payload", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await POST(makeRequest({ action: "getByIds", ids: "not-array" }));
      expect(res.status).toBe(400);
      expect(getGoogleDocsByIdsMock).not.toHaveBeenCalled();
    });

    it("getByIds returns docs when ids is an array of strings", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      getGoogleDocsByIdsMock.mockResolvedValueOnce([
        {
          id: "a",
          name: "By Id",
          modifiedTime: "2026-01-01T00:00:00Z",
          webViewLink: "https://example.com",
          ownedByMe: true,
        },
      ]);

      const res = await POST(makeRequest({ action: "getByIds", ids: ["a", "b"] }));
      expect(res.status).toBe(200);
      expect(getGoogleDocsByIdsMock).toHaveBeenCalledWith("test-token", ["a", "b"]);
    });
  });

  describe("PUT", () => {
    it("returns 401 without a session access token", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await PUT(makeRequest({ documentId: "d", content: sampleContent }));
      expect(res.status).toBe(401);
      expect(updateGoogleDocFromContentMock).not.toHaveBeenCalled();
    });

    it("rejects when documentId is missing", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(makeRequest({ content: sampleContent }));
      expect(res.status).toBe(400);
    });

    it("rejects when content is not a well-formed document", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(makeRequest({ documentId: "d", content: "not a doc" }));
      expect(res.status).toBe(400);
    });

    it("rejects when content is missing", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(makeRequest({ documentId: "d" }));
      expect(res.status).toBe(400);
    });

    it("rejects when prevContent is present but malformed", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(
        makeRequest({
          documentId: "d",
          content: sampleContent,
          prevContent: "bad",
          baseRevisionId: "rev",
        })
      );
      expect(res.status).toBe(400);
      expect(updateGoogleDocFromContentMock).not.toHaveBeenCalled();
    });

    it("updates the document and returns revisionId on success", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      updateGoogleDocFromContentMock.mockResolvedValueOnce({
        success: true,
        wordCount: 2,
        revisionId: "rev-next",
        saveMode: "diff",
      });

      const res = await PUT(
        makeRequest({
          documentId: "doc-1",
          content: sampleContent,
          tabId: "t1",
          prevContent: sampleContent,
          baseRevisionId: "rev-prev",
        })
      );
      expect(res.status).toBe(200);
      expect(updateGoogleDocFromContentMock).toHaveBeenCalledWith(
        "test-token",
        "doc-1",
        sampleContent,
        "t1",
        { prevContent: sampleContent, baseRevisionId: "rev-prev" }
      );
      await expect(res.json()).resolves.toEqual({
        success: true,
        wordCount: 2,
        revisionId: "rev-next",
        saveMode: "diff",
      });
    });

    it("still succeeds when prevContent and baseRevisionId are omitted (legacy client)", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      updateGoogleDocFromContentMock.mockResolvedValueOnce({
        success: true,
        wordCount: 2,
        revisionId: "rev-next",
        saveMode: "replace",
        replaceReason: "no prevContent baseline",
      });

      const res = await PUT(
        makeRequest({ documentId: "doc-1", content: sampleContent, tabId: "t1" })
      );
      expect(res.status).toBe(200);
      expect(updateGoogleDocFromContentMock).toHaveBeenCalledWith(
        "test-token",
        "doc-1",
        sampleContent,
        "t1",
        { prevContent: null, baseRevisionId: null }
      );
    });

    it("returns 409 with DOCUMENT_DRIFT code when the helper throws DocumentDriftError", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      updateGoogleDocFromContentMock.mockRejectedValueOnce(new DocumentDriftError());
      vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await PUT(
        makeRequest({
          documentId: "doc-1",
          content: sampleContent,
          prevContent: sampleContent,
          baseRevisionId: "stale",
        })
      );
      expect(res.status).toBe(409);
      const body = (await res.json()) as { code?: string };
      expect(body.code).toBe("DOCUMENT_DRIFT");
    });
  });
});
