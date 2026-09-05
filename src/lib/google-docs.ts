import { google } from "googleapis";
import type { GoogleDoc, DocumentTab } from "./types";
import type { DocumentContent } from "./document-content";
import { getPlainText } from "./document-content";
import { googleDocsToContent, type GoogleDocsDocument } from "./google-docs-to-content";
import { contentToGoogleDocsRequests } from "./content-to-google-docs";
import { diffDocumentContent } from "./document-content-diff";

export type { GoogleDoc, DocumentTab };

// Thrown when the fetched document's revisionId no longer matches the baseline
// the client sent. Callers map this to a 409 so the UI can prompt for reload.
export class DocumentDriftError extends Error {
  readonly code = "DOCUMENT_DRIFT";
  constructor(message = "Document changed since baseline; refresh to continue.") {
    super(message);
    this.name = "DocumentDriftError";
  }
}

// Minimal shape of the Drive REST client methods we call. Kept local so tests
// don't need to import googleapis just to type a stub.
type DriveClient = ReturnType<typeof google.drive>;

interface DriveFileMeta {
  id?: string | null;
  name?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
  ownedByMe?: boolean | null;
  parents?: string[] | null;
}

// Fields we ask Drive for when listing / getting docs so we can build a path.
const DOC_LIST_FIELDS = "files(id, name, modifiedTime, webViewLink, ownedByMe, parents)";
const DOC_META_FIELDS = "id, name, modifiedTime, webViewLink, ownedByMe, parents";

interface FolderCacheEntry {
  name: string;
  parents: string[];
}

// Walks up the Drive folder chain, caching visits so multiple docs sharing a
// prefix (very common) don't refetch the same folders.
async function resolveFolderPath(
  drive: DriveClient,
  parents: string[] | null | undefined,
  cache: Map<string, FolderCacheEntry>
): Promise<string | undefined> {
  const first = parents?.[0];
  if (!first) return undefined;

  const chain: string[] = [];
  let current: string | undefined = first;
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    seen.add(current);
    let entry = cache.get(current);
    if (!entry) {
      try {
        const res: { data: DriveFileMeta } = await drive.files.get({
          fileId: current,
          fields: "name, parents",
        });
        entry = {
          name: res.data.name ?? "",
          parents: res.data.parents ?? [],
        };
        cache.set(current, entry);
      } catch {
        // Folder is inaccessible (shared with limited scope, deleted, etc.).
        break;
      }
    }
    if (!entry.name) break;
    chain.unshift(entry.name);
    current = entry.parents[0];
  }

  return chain.length > 0 ? chain.join(" / ") : undefined;
}

async function toGoogleDoc(
  file: DriveFileMeta,
  drive: DriveClient,
  cache: Map<string, FolderCacheEntry>
): Promise<GoogleDoc> {
  const path = await resolveFolderPath(drive, file.parents ?? undefined, cache);
  const doc: GoogleDoc = {
    id: file.id!,
    name: file.name!,
    modifiedTime: file.modifiedTime!,
    webViewLink: file.webViewLink!,
    ownedByMe: file.ownedByMe ?? true,
  };
  if (path) doc.path = path;
  return doc;
}

/**
 * Create a new Google Doc with the given title
 */
export async function createGoogleDoc(accessToken: string, title: string): Promise<GoogleDoc> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });

  const createResponse = await docs.documents.create({
    requestBody: { title },
  });

  const documentId = createResponse.data.documentId!;

  const fileResponse = await drive.files.get({
    fileId: documentId,
    fields: DOC_META_FIELDS,
  });

  return toGoogleDoc(fileResponse.data as DriveFileMeta, drive, new Map());
}

/**
 * Get a list of Google Docs owned by the user (most recently modified first).
 */
export async function listGoogleDocs(accessToken: string): Promise<GoogleDoc[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.document' and trashed=false and 'me' in owners",
    fields: DOC_LIST_FIELDS,
    orderBy: "modifiedTime desc",
    pageSize: 16,
  });

  const files = (response.data.files ?? []) as DriveFileMeta[];
  const cache = new Map<string, FolderCacheEntry>();
  return Promise.all(files.map((file) => toGoogleDoc(file, drive, cache)));
}

/**
 * Search for Google Docs the user owns whose name matches the query.
 */
export async function searchGoogleDocs(
  accessToken: string,
  rawQuery: string
): Promise<GoogleDoc[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });

  // Drive's `q` parameter uses single quotes as string delimiters; escape any
  // in the user's query to prevent it breaking out of the string.
  const escaped = query.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = `mimeType='application/vnd.google-apps.document' and trashed=false and 'me' in owners and name contains '${escaped}'`;

  const response = await drive.files.list({
    q,
    fields: DOC_LIST_FIELDS,
    orderBy: "modifiedTime desc",
    pageSize: 25,
  });

  const files = (response.data.files ?? []) as DriveFileMeta[];
  const cache = new Map<string, FolderCacheEntry>();
  return Promise.all(files.map((file) => toGoogleDoc(file, drive, cache)));
}

/**
 * Resolve a set of Google Doc IDs to full metadata. Silently drops IDs the
 * user can no longer access (deleted, unshared).
 */
export async function getGoogleDocsByIds(accessToken: string, ids: string[]): Promise<GoogleDoc[]> {
  const uniqueIds = Array.from(
    new Set(ids.filter((id) => typeof id === "string" && id.length > 0))
  );
  if (uniqueIds.length === 0) return [];

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });
  const cache = new Map<string, FolderCacheEntry>();

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const res = await drive.files.get({ fileId: id, fields: DOC_META_FIELDS });
        return await toGoogleDoc(res.data as DriveFileMeta, drive, cache);
      } catch {
        return null;
      }
    })
  );

  return results.filter((doc): doc is GoogleDoc => doc !== null);
}

/**
 * Get all tabs within a Google Doc
 */
export async function getDocumentTabs(
  accessToken: string,
  documentId: string
): Promise<DocumentTab[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });

  const response = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  const tabs: DocumentTab[] = [];

  // Define interface for tab structure since types may not be up to date
  interface TabData {
    tabProperties?: {
      tabId?: string | null;
      title?: string | null;
      index?: number | null;
      nestingLevel?: number | null;
      parentTabId?: string | null;
    };
    childTabs?: TabData[];
  }

  // Helper function to recursively extract tabs
  const extractTabs = (tabList: TabData[] | undefined, parentTabId?: string) => {
    if (!tabList) return;

    for (const tab of tabList) {
      if (tab.tabProperties) {
        tabs.push({
          tabId: tab.tabProperties.tabId || "",
          title: tab.tabProperties.title || "Untitled",
          index: tab.tabProperties.index || 0,
          nestingLevel: tab.tabProperties.nestingLevel || 0,
          parentTabId: parentTabId || tab.tabProperties.parentTabId || undefined,
        });
      }

      // Process child tabs recursively
      if (tab.childTabs && tab.childTabs.length > 0) {
        extractTabs(tab.childTabs, tab.tabProperties?.tabId || undefined);
      }
    }
  };

  // googleapis types omit the `tabs` field on Document; cast to our local shape.
  extractTabs(response.data.tabs as unknown as TabData[]);

  return tabs;
}

// NOTE: The Google Docs API does NOT support creating, deleting, or renaming tabs programmatically.
// Tabs are read-only via the API. Users must manage tabs directly in Google Docs.
// The following functions (createDocumentTab, deleteDocumentTab, updateDocumentTab) have been removed
// because these operations are not supported by the Google Docs API.

/**
 * Get the content and word count of a Google Doc, summed across every tab
 * (Docs only returns the first tab's body unless includeTabsContent is set).
 */
export async function getGoogleDocContent(accessToken: string, documentId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });

  const response = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  const document = response.data;

  interface DocsParagraphElement {
    textRun?: { content?: string | null } | null;
  }
  interface DocsStructuralElement {
    paragraph?: { elements?: DocsParagraphElement[] | null } | null;
  }
  interface DocsTabNode {
    documentTab?: { body?: { content?: DocsStructuralElement[] | null } | null } | null;
    childTabs?: DocsTabNode[] | null;
  }

  const extractText = (content: DocsStructuralElement[] | null | undefined): string => {
    let text = "";
    for (const element of content ?? []) {
      for (const elem of element.paragraph?.elements ?? []) {
        if (elem.textRun?.content) text += elem.textRun.content;
      }
    }
    return text;
  };

  const collectTabsText = (tabs: DocsTabNode[] | null | undefined): string => {
    let text = "";
    for (const tab of tabs ?? []) {
      text += extractText(tab.documentTab?.body?.content);
      if (tab.childTabs) text += collectTabsText(tab.childTabs);
    }
    return text;
  };

  const tabs = document.tabs as unknown as DocsTabNode[] | undefined;
  const text =
    tabs && tabs.length > 0
      ? collectTabsText(tabs)
      : extractText(document.body?.content as DocsStructuralElement[] | undefined);

  // Calculate word count
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return {
    documentId,
    title: document.title || "Untitled",
    text,
    wordCount,
  };
}

/**
 * Get word count delta for a document since a specific time
 */
export async function getWordCountDelta(
  accessToken: string,
  documentId: string,
  sinceDate: Date
): Promise<number> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });

  try {
    // Get revisions for the document
    const revisionsResponse = await drive.revisions.list({
      fileId: documentId,
      fields: "revisions(id,modifiedTime)",
    });

    const revisions = revisionsResponse.data.revisions || [];

    // Find revision closest to sinceDate
    const baseRevision = revisions.find((rev) => new Date(rev.modifiedTime!) <= sinceDate);

    if (baseRevision) {
      // Note: Google Docs API doesn't support getting document content at specific revisions
      // A production implementation would store daily snapshots in a database
      // For now, return current word count as the delta
      const currentContent = await getGoogleDocContent(accessToken, documentId);
      return currentContent.wordCount;
    }

    // If no baseline, return current word count
    const currentContent = await getGoogleDocContent(accessToken, documentId);
    return currentContent.wordCount;
  } catch (error) {
    console.error("Error getting word count delta:", error);
    return 0;
  }
}

// Fetches a Google Doc and returns it in the editor-agnostic DocumentContent
// wire format used by the client, alongside the current revisionId so the
// client can send it back as a drift baseline on save.
export async function getGoogleDocAsContent(
  accessToken: string,
  documentId: string,
  tabId?: string
): Promise<{ content: DocumentContent; revisionId: string }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });
  const response = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  const content = googleDocsToContent(response.data as unknown as GoogleDocsDocument, tabId);
  return { content, revisionId: response.data.revisionId ?? "" };
}

export interface UpdateGoogleDocOptions {
  prevContent?: DocumentContent | null;
  baseRevisionId?: string | null;
}

export interface UpdateGoogleDocResult {
  success: boolean;
  wordCount: number;
  revisionId: string;
  // 'diff' means we sent a minimal batchUpdate; 'replace' means the whole doc
  // was deleted and re-inserted. Surfaced so the client can log / display it
  // and so we can detect regressions where diff silently degrades to replace.
  saveMode: "diff" | "replace";
  // Populated when saveMode === 'replace' so we can see why we bailed
  // (planner reason, diff-batch error, or missing baseline).
  replaceReason?: string;
}

// Writes DocumentContent back to a Google Doc. When prevContent and
// baseRevisionId are provided, computes and sends a minimal diff; otherwise
// falls back to the legacy full-replace path so older client payloads still
// work during rollout. Throws DocumentDriftError on revision mismatch.
export async function updateGoogleDocFromContent(
  accessToken: string,
  documentId: string,
  content: DocumentContent,
  tabId?: string,
  options: UpdateGoogleDocOptions = {}
): Promise<UpdateGoogleDocResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: "v1", auth });

  const currentDoc = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });
  const currentRevisionId = currentDoc.data.revisionId ?? "";

  const { prevContent, baseRevisionId } = options;
  const canDiff = prevContent != null && baseRevisionId != null && baseRevisionId.length > 0;

  if (canDiff && baseRevisionId !== currentRevisionId) {
    throw new DocumentDriftError();
  }

  const diffPlan = canDiff ? diffDocumentContent(prevContent, content, tabId) : null;
  const diffIsUsable = diffPlan?.mode === "diff";
  const diffRequests = diffIsUsable ? diffPlan.requests : null;

  const runBatch = async (requests: object[]): Promise<void> => {
    if (requests.length === 0) return;
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  };

  let saveMode: "diff" | "replace" = "diff";
  let replaceReason: string | undefined;

  if (diffRequests) {
    try {
      await runBatch(diffRequests);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Diff-based save failed; retrying with full replace.", message);
      const fullReplaceRequests = buildFullReplaceRequests(currentDoc.data, content, tabId);
      await runBatch(fullReplaceRequests);
      saveMode = "replace";
      replaceReason = `diff batch rejected by Google Docs: ${message}`;
    }
  } else {
    const fullReplaceRequests = buildFullReplaceRequests(currentDoc.data, content, tabId);
    await runBatch(fullReplaceRequests);
    saveMode = "replace";
    if (!canDiff) {
      replaceReason =
        prevContent == null ? "no prevContent baseline" : "no baseRevisionId baseline";
    } else if (diffPlan?.mode === "replace") {
      replaceReason = `diff planner bailed: ${diffPlan.reason}`;
    }
  }

  const postDoc = await docs.documents.get({ documentId });
  const revisionId = postDoc.data.revisionId ?? currentRevisionId;

  const wordCount = getPlainText(content)
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const result: UpdateGoogleDocResult = { success: true, wordCount, revisionId, saveMode };
  if (replaceReason) result.replaceReason = replaceReason;
  return result;
}

interface DocsBodyElement {
  endIndex?: number | null;
}

interface DocsTabForEnd {
  tabProperties?: { tabId?: string | null };
  documentTab?: { body?: { content?: DocsBodyElement[] | null } | null } | null;
  childTabs?: DocsTabForEnd[] | null;
}

function findTabByIdForEnd(
  tabs: DocsTabForEnd[] | null | undefined,
  targetId: string
): DocsTabForEnd | undefined {
  if (!tabs) return undefined;
  for (const tab of tabs) {
    if (tab.tabProperties?.tabId === targetId) return tab;
    const found = findTabByIdForEnd(tab.childTabs, targetId);
    if (found) return found;
  }
  return undefined;
}

// Deletes the existing content (if any) and reinserts everything from
// `content`. Kept as the fallback path when diff is unavailable or the planner
// bails out (e.g. tables present, backwards-compat legacy payload).
function buildFullReplaceRequests(
  currentDocData: {
    tabs?: unknown;
    body?: { content?: DocsBodyElement[] | null } | null;
  },
  content: DocumentContent,
  tabId?: string
): object[] {
  let endIndex = 1;

  if (tabId && currentDocData.tabs) {
    const target = findTabByIdForEnd(currentDocData.tabs as DocsTabForEnd[], tabId);
    for (const element of target?.documentTab?.body?.content ?? []) {
      if (element.endIndex && element.endIndex > endIndex) endIndex = element.endIndex;
    }
  } else {
    for (const element of currentDocData.body?.content ?? []) {
      if (element.endIndex && element.endIndex > endIndex) endIndex = element.endIndex;
    }
  }

  const requests: object[] = [];

  if (endIndex > 2) {
    const deleteRange: { startIndex: number; endIndex: number; tabId?: string } = {
      startIndex: 1,
      endIndex: endIndex - 1,
    };
    if (tabId) deleteRange.tabId = tabId;
    requests.push({ deleteContentRange: { range: deleteRange } });
  }

  const { requests: insertRequests } = contentToGoogleDocsRequests(content, tabId);
  requests.push(...insertRequests);

  return requests;
}
