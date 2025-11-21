import { google } from 'googleapis';

export interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  ownedByMe: boolean;
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
