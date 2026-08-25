import { google } from 'googleapis';
import type { GoogleDoc, DocumentTab } from './types';
import type { DocumentContent } from './document-content';
import { getPlainText } from './document-content';
import {
  googleDocsToContent,
  type GoogleDocsDocument,
} from './google-docs-to-content';
import { contentToGoogleDocsRequests } from './content-to-google-docs';

export type { GoogleDoc, DocumentTab };

/**
 * Create a new Google Doc with the given title
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string
): Promise<GoogleDoc> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Create the document using Google Docs API
  const createResponse = await docs.documents.create({
    requestBody: {
      title,
    },
  });

  const documentId = createResponse.data.documentId!;

  // Get full file metadata from Drive API
  const fileResponse = await drive.files.get({
    fileId: documentId,
    fields: 'id, name, modifiedTime, webViewLink, ownedByMe',
  });

  return {
    id: fileResponse.data.id!,
    name: fileResponse.data.name!,
    modifiedTime: fileResponse.data.modifiedTime!,
    webViewLink: fileResponse.data.webViewLink!,
    ownedByMe: fileResponse.data.ownedByMe ?? true,
  };
}

/**
 * Get a list of Google Docs owned by or shared with the user
 */
export async function listGoogleDocs(accessToken: string): Promise<GoogleDoc[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.document' and trashed=false and 'me' in owners",
    fields: 'files(id, name, modifiedTime, webViewLink, ownedByMe)',
    orderBy: 'modifiedTime desc',
    pageSize: 16, // Get most recent 16 docs
  });

  return (response.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    modifiedTime: file.modifiedTime!,
    webViewLink: file.webViewLink!,
    ownedByMe: file.ownedByMe ?? true,
  }));
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

  const docs = google.docs({ version: 'v1', auth });

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
          tabId: tab.tabProperties.tabId || '',
          title: tab.tabProperties.title || 'Untitled',
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
 * Get the content and word count of a Google Doc
 */
export async function getGoogleDocContent(
  accessToken: string,
  documentId: string
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({
    documentId,
  });

  const document = response.data;
  
  // Extract text content from the document
  let text = '';
  const content = document.body?.content || [];
  
  for (const element of content) {
    if (element.paragraph) {
      const paragraphElements = element.paragraph.elements || [];
      for (const elem of paragraphElements) {
        if (elem.textRun?.content) {
          text += elem.textRun.content;
        }
      }
    }
  }

  // Calculate word count
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return {
    documentId,
    title: document.title || 'Untitled',
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

  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get revisions for the document
    const revisionsResponse = await drive.revisions.list({
      fileId: documentId,
      fields: 'revisions(id,modifiedTime)',
    });

    const revisions = revisionsResponse.data.revisions || [];
    
    // Find revision closest to sinceDate
    const baseRevision = revisions.find(
      (rev) => new Date(rev.modifiedTime!) <= sinceDate
    );

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
    console.error('Error getting word count delta:', error);
    return 0;
  }
}

// Fetches a Google Doc and returns it in the editor-agnostic DocumentContent
// wire format used by the client.
export async function getGoogleDocAsContent(
  accessToken: string,
  documentId: string,
  tabId?: string
): Promise<DocumentContent> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });
  const response = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  return googleDocsToContent(response.data as unknown as GoogleDocsDocument, tabId);
}

// Replaces the content of a Google Doc (or a specific tab) with the given
// DocumentContent by deleting the existing range and applying the requests
// produced by contentToGoogleDocsRequests.
//
// Known limitation: table cell content is not yet preserved on write. Tables
// are inserted with the right dimensions but empty cells. Full cell-content
// preservation requires a second batchUpdate after re-fetching the document
// to learn the real cell indices; see plan follow-up.
export async function updateGoogleDocFromContent(
  accessToken: string,
  documentId: string,
  content: DocumentContent,
  tabId?: string
): Promise<{ success: boolean; wordCount: number }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  const currentDoc = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  let endIndex = 1;

  interface TabData {
    tabProperties?: { tabId?: string | null };
    documentTab?: {
      body?: { content?: Array<{ endIndex?: number | null }> };
    };
    childTabs?: TabData[];
  }

  const findTab = (tabs: TabData[], targetId: string): TabData | undefined => {
    for (const tab of tabs) {
      if (tab.tabProperties?.tabId === targetId) return tab;
      if (tab.childTabs) {
        const found = findTab(tab.childTabs, targetId);
        if (found) return found;
      }
    }
    return undefined;
  };

  if (tabId && currentDoc.data.tabs) {
    const target = findTab(currentDoc.data.tabs as unknown as TabData[], tabId);
    for (const element of target?.documentTab?.body?.content ?? []) {
      if (element.endIndex && element.endIndex > endIndex) endIndex = element.endIndex;
    }
  } else {
    for (const element of currentDoc.data.body?.content ?? []) {
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

  const { requests: insertRequests, plainText } = contentToGoogleDocsRequests(content, tabId);
  requests.push(...insertRequests);

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  const derivedPlainText = plainText.length > 0 ? plainText : getPlainText(content);
  const wordCount = derivedPlainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return { success: true, wordCount };
}
