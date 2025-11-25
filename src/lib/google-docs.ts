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

      // Process text runs and merge consecutive runs with same formatting
      interface TextRun {
        content: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        strikethrough?: boolean;
        link?: string;
      }

      const runs: TextRun[] = [];
      
      for (const elem of paragraphElements) {
        if (elem.textRun?.content) {
          const textStyle = elem.textRun.textStyle;
          runs.push({
            content: elem.textRun.content,
            bold: textStyle?.bold || false,
            italic: textStyle?.italic || false,
            underline: textStyle?.underline || false,
            strikethrough: textStyle?.strikethrough || false,
            link: textStyle?.link?.url ?? undefined,
          });
        }
      }

      // Merge consecutive runs with identical formatting
      const mergedRuns: TextRun[] = [];
      for (const run of runs) {
        const last = mergedRuns[mergedRuns.length - 1];
        if (
          last &&
          last.bold === run.bold &&
          last.italic === run.italic &&
          last.underline === run.underline &&
          last.strikethrough === run.strikethrough &&
          last.link === run.link
        ) {
          last.content += run.content;
        } else {
          mergedRuns.push({ ...run });
        }
      }

      // Helper to escape special characters so they display as literal characters
      // This escapes both HTML entities and markdown special characters
      const escapeSpecialChars = (text: string): string => {
        return text
          // Escape backslashes first (so we don't double-escape later escapes)
          .replace(/\\/g, '\\\\')
          // HTML entities
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          // Markdown special characters
          .replace(/\*/g, '\\*')
          .replace(/_/g, '\\_')
          .replace(/~/g, '\\~')
          .replace(/`/g, '\\`')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/#/g, '\\#')
          .replace(/\|/g, '\\|');
      };

      // Convert merged runs to markdown
      for (const run of mergedRuns) {
        const text = run.content;

        // Preserve newlines without formatting
        if (text === '\n') {
          paragraphText += text;
          continue;
        }

        // If no formatting, escape special chars and add the text
        const hasFormatting = run.bold || run.italic || run.underline || run.strikethrough || run.link;
        if (!hasFormatting) {
          paragraphText += escapeSpecialChars(text);
          continue;
        }

        // For formatted text, handle leading/trailing spaces
        const trimmedText = text.trim();
        if (!trimmedText) {
          paragraphText += text;
          continue;
        }

        const leadingSpace = text.startsWith(' ') ? ' ' : '';
        const trailingSpace = text.endsWith(' ') && text !== ' ' ? ' ' : '';

        // Escape special characters in the content so literal chars show up
        let formattedText = escapeSpecialChars(trimmedText);

        // Apply formatting layers (innermost to outermost)
        if (run.strikethrough) {
          formattedText = `~~${formattedText}~~`;
        }

        if (run.underline) {
          formattedText = `<u>${formattedText}</u>`;
        }

        if (run.italic && run.bold) {
          formattedText = `***${formattedText}***`;
        } else if (run.bold) {
          formattedText = `**${formattedText}**`;
        } else if (run.italic) {
          formattedText = `*${formattedText}*`;
        }

        if (run.link) {
          formattedText = `[${formattedText}](${run.link})`;
        }

        paragraphText += leadingSpace + formattedText + trailingSpace;
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
