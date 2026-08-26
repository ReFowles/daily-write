import { describe, expect, it } from "vitest";
import { classifyGoogleDocsSaveResponse } from "./google-docs-save-response";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("classifyGoogleDocsSaveResponse", () => {
  it("returns an ok outcome with revisionId and saveMode from the response body", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(200, {
        revisionId: "rev-123",
        saveMode: "incremental",
      })
    );

    expect(outcome).toEqual({
      kind: "ok",
      revisionId: "rev-123",
      saveMode: "incremental",
      replaceReason: null,
    });
  });

  it("keeps the replaceReason when the server fell back to full-replace", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(200, {
        revisionId: "rev-9",
        saveMode: "replace",
        replaceReason: "diff too large",
      })
    );

    expect(outcome).toEqual({
      kind: "ok",
      revisionId: "rev-9",
      saveMode: "replace",
      replaceReason: "diff too large",
    });
  });

  it("returns null revisionId when the server omitted or blanked it", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(jsonResponse(200, {}));
    expect(outcome).toEqual({
      kind: "ok",
      revisionId: null,
      saveMode: null,
      replaceReason: null,
    });
  });

  it("classifies 409 with DOCUMENT_DRIFT as a drift outcome", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(409, { code: "DOCUMENT_DRIFT" })
    );

    expect(outcome.kind).toBe("drift");
    if (outcome.kind === "drift") {
      expect(outcome.message).toMatch(/edited elsewhere/i);
      expect(outcome.message).toMatch(/reload the tab/i);
    }
  });

  it("classifies other 409 payloads as a plain error, not drift", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(409, { error: "conflict but not drift" })
    );

    expect(outcome).toEqual({ kind: "error", message: "conflict but not drift" });
  });

  it("uses the server error and details when the response fails", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(500, { error: "Google API error", details: "quota exceeded" })
    );

    expect(outcome).toEqual({
      kind: "error",
      message: "Google API error: quota exceeded",
    });
  });

  it("falls back to a default error message when the body is empty", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      new Response("not json", { status: 502 })
    );

    expect(outcome).toEqual({
      kind: "error",
      message: "Failed to save to Google Docs",
    });
  });

  it("ignores non-string details when composing the error message", async () => {
    const outcome = await classifyGoogleDocsSaveResponse(
      jsonResponse(400, { error: "Bad request", details: { foo: "bar" } })
    );

    expect(outcome).toEqual({ kind: "error", message: "Bad request" });
  });
});
