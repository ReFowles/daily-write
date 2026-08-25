import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/google-docs", () => ({
  listGoogleDocs: vi.fn(),
  getGoogleDocAsMarkdown: vi.fn(),
  updateGoogleDoc: vi.fn(),
  createGoogleDoc: vi.fn(),
  getDocumentTabs: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  createGoogleDoc,
  getDocumentTabs,
  getGoogleDocAsMarkdown,
  listGoogleDocs,
  updateGoogleDoc,
} from "@/lib/google-docs";
import { GET, POST, PUT } from "./route";

type MinimalSession = { accessToken: string } | null;

// NextAuth's `auth` is overloaded for middleware/pages/routes; narrow it for testing.
const authMock = vi.mocked(auth as unknown as () => Promise<MinimalSession>);
const listGoogleDocsMock = vi.mocked(listGoogleDocs);
const createGoogleDocMock = vi.mocked(createGoogleDoc);
const getDocumentTabsMock = vi.mocked(getDocumentTabs);
const getGoogleDocAsMarkdownMock = vi.mocked(getGoogleDocAsMarkdown);
const updateGoogleDocMock = vi.mocked(updateGoogleDoc);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/google-docs", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const authenticatedSession: MinimalSession = { accessToken: "test-token" };

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

    it("default action returns markdown for the document", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      getGoogleDocAsMarkdownMock.mockResolvedValueOnce("# hello");

      const res = await POST(makeRequest({ documentId: "doc-1", tabId: "t1" }));
      expect(res.status).toBe(200);
      expect(getGoogleDocAsMarkdownMock).toHaveBeenCalledWith("test-token", "doc-1", "t1");
      await expect(res.json()).resolves.toEqual({ markdown: "# hello" });
    });
  });

  describe("PUT", () => {
    it("returns 401 without a session access token", async () => {
      authMock.mockResolvedValueOnce(null);
      const res = await PUT(makeRequest({ documentId: "d", markdown: "m" }));
      expect(res.status).toBe(401);
      expect(updateGoogleDocMock).not.toHaveBeenCalled();
    });

    it("rejects when documentId is missing", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(makeRequest({ markdown: "m" }));
      expect(res.status).toBe(400);
    });

    it("rejects when markdown is not a string", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      const res = await PUT(makeRequest({ documentId: "d", markdown: 42 }));
      expect(res.status).toBe(400);
    });

    it("updates the document when inputs are valid", async () => {
      authMock.mockResolvedValueOnce(authenticatedSession);
      updateGoogleDocMock.mockResolvedValueOnce({ success: true, wordCount: 3 });

      const res = await PUT(
        makeRequest({ documentId: "doc-1", markdown: "hello world!", tabId: "t1" })
      );
      expect(res.status).toBe(200);
      expect(updateGoogleDocMock).toHaveBeenCalledWith("test-token", "doc-1", "hello world!", "t1");
    });
  });
});
