import { auth } from "@/lib/auth";
import {
  listGoogleDocs,
  getGoogleDocAsContent,
  updateGoogleDocFromContent,
  createGoogleDoc,
  getDocumentTabs,
  createDocumentTab,
  deleteDocumentTab,
  updateDocumentTab,
  searchGoogleDocs,
  getGoogleDocsByIds,
  getGoogleDocContent,
  applyManuscriptFormat,
  removeManuscriptFormat,
  DocumentDriftError,
} from "@/lib/google-docs";
import { isDocumentContent } from "@/lib/document-content";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const docs = await listGoogleDocs(session.accessToken);
    return NextResponse.json({ docs });
  } catch (error) {
    console.error("Error fetching Google Docs:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle different actions
    switch (body.action) {
      case "create": {
        const { title } = body;

        if (!title || typeof title !== "string") {
          return NextResponse.json({ error: "Document title is required" }, { status: 400 });
        }

        const newDoc = await createGoogleDoc(session.accessToken, title);
        return NextResponse.json({ doc: newDoc });
      }

      case "getTabs": {
        const { documentId } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const tabs = await getDocumentTabs(session.accessToken, documentId);
        return NextResponse.json({ tabs });
      }

      case "createTab": {
        const { documentId, title, parentTabId, index } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const result = await createDocumentTab(session.accessToken, documentId, {
          title: typeof title === "string" ? title : undefined,
          parentTabId: typeof parentTabId === "string" ? parentTabId : undefined,
          index: typeof index === "number" ? index : undefined,
        });
        return NextResponse.json(result);
      }

      case "updateTab": {
        const { documentId, tabId, title, parentTabId, index } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }
        if (!tabId || typeof tabId !== "string") {
          return NextResponse.json({ error: "Tab ID is required" }, { status: 400 });
        }

        const result = await updateDocumentTab(session.accessToken, documentId, tabId, {
          title: typeof title === "string" ? title : undefined,
          parentTabId: typeof parentTabId === "string" ? parentTabId : undefined,
          index: typeof index === "number" ? index : undefined,
        });
        return NextResponse.json(result);
      }

      case "deleteTab": {
        const { documentId, tabId } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }
        if (!tabId || typeof tabId !== "string") {
          return NextResponse.json({ error: "Tab ID is required" }, { status: 400 });
        }

        const result = await deleteDocumentTab(session.accessToken, documentId, tabId);
        return NextResponse.json(result);
      }

      case "search": {
        const { query } = body;

        if (typeof query !== "string") {
          return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }

        const docs = await searchGoogleDocs(session.accessToken, query);
        return NextResponse.json({ docs });
      }

      case "getByIds": {
        const { ids } = body;

        if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
          return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
        }

        const docs = await getGoogleDocsByIds(session.accessToken, ids);
        return NextResponse.json({ docs });
      }

      case "getWordCount": {
        const { documentId } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const { wordCount } = await getGoogleDocContent(session.accessToken, documentId);
        return NextResponse.json({ wordCount });
      }

      case "applyManuscriptFormat":
      case "removeManuscriptFormat": {
        const { documentId, tabId } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const runner =
          body.action === "applyManuscriptFormat"
            ? applyManuscriptFormat
            : removeManuscriptFormat;
        const revisionId = await runner(
          session.accessToken,
          documentId,
          typeof tabId === "string" ? tabId : undefined
        );
        return NextResponse.json({ ok: true, revisionId });
      }

      default: {
        // Default behavior: get document content
        const { documentId, tabId } = body;

        if (!documentId) {
          return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const { content, revisionId, isManuscriptFormat } = await getGoogleDocAsContent(
          session.accessToken,
          documentId,
          tabId
        );

        return NextResponse.json({ content, revisionId, isManuscriptFormat });
      }
    }
  } catch (error) {
    console.error("Error processing Google Doc request:", error);
    return NextResponse.json({ error: "Failed to process document request" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, content, tabId, prevContent, baseRevisionId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    if (!isDocumentContent(content)) {
      return NextResponse.json({ error: "Valid document content is required" }, { status: 400 });
    }

    if (prevContent !== undefined && prevContent !== null && !isDocumentContent(prevContent)) {
      return NextResponse.json(
        { error: "prevContent must be valid document content when supplied" },
        { status: 400 }
      );
    }

    const result = await updateGoogleDocFromContent(
      session.accessToken,
      documentId,
      content,
      tabId,
      {
        prevContent: prevContent ?? null,
        baseRevisionId: typeof baseRevisionId === "string" ? baseRevisionId : null,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DocumentDriftError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 });
    }
    console.error("Error updating Google Doc:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to update document", details }, { status: 500 });
  }
}
