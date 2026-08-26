/**
 * Interprets a response from `PUT /api/google-docs` and returns a
 * discriminated union describing the outcome.
 *
 * The server surfaces `409 { code: "DOCUMENT_DRIFT" }` when the underlying
 * Google Doc was edited elsewhere since we last read it. Callers must stop
 * auto-saving and prompt the user to reload the tab in that case.
 */

export type GoogleDocsSaveOutcome =
  | {
      kind: "ok";
      revisionId: string | null;
      saveMode: string | null;
      replaceReason: string | null;
    }
  | { kind: "drift"; message: string }
  | { kind: "error"; message: string };

const DRIFT_MESSAGE =
  "This document was edited elsewhere. Reload the tab to continue writing.";
const DEFAULT_ERROR = "Failed to save to Google Docs";

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const data = await response.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function classifyGoogleDocsSaveResponse(
  response: Response
): Promise<GoogleDocsSaveOutcome> {
  const body = await safeJson(response);

  if (response.status === 409 && body.code === "DOCUMENT_DRIFT") {
    return { kind: "drift", message: DRIFT_MESSAGE };
  }

  if (!response.ok) {
    const errorLabel = typeof body.error === "string" ? body.error : DEFAULT_ERROR;
    const details = typeof body.details === "string" && body.details.length > 0
      ? body.details
      : null;
    const message = details ? `${errorLabel}: ${details}` : errorLabel;
    return { kind: "error", message };
  }

  return {
    kind: "ok",
    revisionId:
      typeof body.revisionId === "string" && body.revisionId.length > 0
        ? body.revisionId
        : null,
    saveMode: typeof body.saveMode === "string" ? body.saveMode : null,
    replaceReason: typeof body.replaceReason === "string" ? body.replaceReason : null,
  };
}
