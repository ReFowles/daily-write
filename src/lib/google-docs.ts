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
 * Convert Google Docs content to Markdown
 */
export async function getGoogleDocAsMarkdown(
  accessToken: string,
  documentId: string
): Promise<string> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({
    documentId,
  });

  const document = response.data;
  let markdown = '';
  const content = document.body?.content || [];

  for (const element of content) {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      const paragraphElements = paragraph.elements || [];
      let paragraphText = '';

      // Check if this is a heading
      const namedStyleType = paragraph.paragraphStyle?.namedStyleType;
      let headingPrefix = '';
      if (namedStyleType?.startsWith('HEADING_')) {
        const level = namedStyleType.replace('HEADING_', '');
        headingPrefix = '#'.repeat(parseInt(level, 10)) + ' ';
      }

      for (const elem of paragraphElements) {
        if (elem.textRun?.content) {
          let text = elem.textRun.content;
          const textStyle = elem.textRun.textStyle;

          // Skip formatting for newlines and preserve them
          if (text === '\n') {
            paragraphText += text;
            continue;
          }

          // Apply text formatting (preserve leading/trailing spaces)
          const hasFormatting = textStyle?.bold || textStyle?.italic || textStyle?.link?.url;
          const trimmedText = text.trim();
          const leadingSpace = hasFormatting && text.startsWith(' ') ? ' ' : '';
          const trailingSpace = hasFormatting && text.endsWith(' ') && text !== ' ' ? ' ' : '';

          if (textStyle?.link?.url) {
            // Links take precedence
            let linkText = trimmedText;
            if (textStyle.bold && textStyle.italic) {
              linkText = `***${trimmedText}***`;
            } else if (textStyle.bold) {
              linkText = `**${trimmedText}**`;
            } else if (textStyle.italic) {
              linkText = `*${trimmedText}*`;
            }
            text = `${leadingSpace}[${linkText}](${textStyle.link.url})${trailingSpace}`;
          } else if (textStyle?.bold && textStyle?.italic) {
            text = `${leadingSpace}***${trimmedText}***${trailingSpace}`;
          } else if (textStyle?.bold) {
            text = `${leadingSpace}**${trimmedText}**${trailingSpace}`;
          } else if (textStyle?.italic) {
            text = `${leadingSpace}*${trimmedText}*${trailingSpace}`;
          }

          paragraphText += text;
        }
      }

      // Add the paragraph to markdown
      if (paragraphText.trim()) {
        // Remove trailing newline from paragraph text since we'll add our own
        const cleanText = paragraphText.replace(/\n+$/, '');
        markdown += headingPrefix + cleanText;
        
        // Headings need double line break for proper markdown separation
        if (headingPrefix) {
          markdown += '\n\n';
        } else {
          // Regular paragraphs get single line break
          markdown += '\n';
        }
      } else {
        markdown += '\n';
      }
    } else if (element.table) {
      // Basic table support - just add a note for now
      markdown += '_[Table content]_\n\n';
    }
  }

  return markdown.trim();
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
