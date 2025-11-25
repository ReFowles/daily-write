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
 * Convert markdown to Google Docs requests
 * This creates a series of batch update requests to update the document
 */
function markdownToDocRequests(
  markdown: string
): { requests: object[]; plainText: string } {
  const requests: object[] = [];
  const lines = markdown.split('\n');
  let plainText = '';
  const formattingRanges: {
    startIndex: number;
    endIndex: number;
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    link?: string;
  }[] = [];

  // Helper to unescape markdown special characters
  const unescapeMarkdown = (text: string): string => {
    return text
      .replace(/\\([\\*_~`\[\]#|])/g, '$1')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let headingLevel = 0;

    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      headingLevel = headingMatch[1].length;
      line = headingMatch[2];
    }

    // Track the start index for this line
    const lineStartIndex = plainText.length + 1; // +1 for 1-based indexing

    // Process inline formatting (bold, italic, strikethrough, links)
    let processedLine = '';
    let currentIndex = lineStartIndex;
    let remaining = line;

    // Process formatting patterns
    while (remaining.length > 0) {
      // Check for bold+italic (***text***)
      const boldItalicMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
      if (boldItalicMatch) {
        const content = unescapeMarkdown(boldItalicMatch[1]);
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          bold: true,
          italic: true,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(boldItalicMatch[0].length);
        continue;
      }

      // Check for bold (**text**)
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        const content = unescapeMarkdown(boldMatch[1]);
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          bold: true,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic (*text*)
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        const content = unescapeMarkdown(italicMatch[1]);
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          italic: true,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for strikethrough (~~text~~)
      const strikeMatch = remaining.match(/^~~(.+?)~~/);
      if (strikeMatch) {
        const content = unescapeMarkdown(strikeMatch[1]);
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          strikethrough: true,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Check for underline (<u>text</u>)
      const underlineMatch = remaining.match(/^<u>(.+?)<\/u>/);
      if (underlineMatch) {
        const content = unescapeMarkdown(underlineMatch[1]);
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          underline: true,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(underlineMatch[0].length);
        continue;
      }

      // Check for links ([text](url))
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const content = unescapeMarkdown(linkMatch[1]);
        const url = linkMatch[2];
        formattingRanges.push({
          startIndex: currentIndex,
          endIndex: currentIndex + content.length,
          link: url,
        });
        processedLine += content;
        currentIndex += content.length;
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // No formatting, just add the character
      const char = unescapeMarkdown(remaining[0]);
      processedLine += char;
      currentIndex += char.length;
      remaining = remaining.slice(1);
    }

    // Add the line to plain text
    plainText += processedLine;

    // Add newline (except for last line if empty)
    if (i < lines.length - 1 || processedLine.length > 0) {
      plainText += '\n';
    }

    // If this is a heading, store heading info for later
    if (headingLevel > 0) {
      const lineEndIndex = lineStartIndex + processedLine.length;
      formattingRanges.push({
        startIndex: lineStartIndex,
        endIndex: lineEndIndex,
        bold: false, // Will be handled by paragraph style
      });
    }
  }

  // Create the text insertion request
  if (plainText.length > 0) {
    requests.push({
      insertText: {
        location: { index: 1 },
        text: plainText,
      },
    });
  }

  // Create formatting requests (in reverse order so indices stay valid)
  for (const range of formattingRanges.reverse()) {
    if (range.bold || range.italic || range.strikethrough || range.underline) {
      const updateTextStyle: {
        range: { startIndex: number; endIndex: number };
        textStyle: Record<string, boolean>;
        fields: string;
      } = {
        range: {
          startIndex: range.startIndex,
          endIndex: range.endIndex,
        },
        textStyle: {},
        fields: '',
      };

      const fields: string[] = [];
      if (range.bold !== undefined) {
        updateTextStyle.textStyle.bold = range.bold;
        fields.push('bold');
      }
      if (range.italic !== undefined) {
        updateTextStyle.textStyle.italic = range.italic;
        fields.push('italic');
      }
      if (range.strikethrough !== undefined) {
        updateTextStyle.textStyle.strikethrough = range.strikethrough;
        fields.push('strikethrough');
      }
      if (range.underline !== undefined) {
        updateTextStyle.textStyle.underline = range.underline;
        fields.push('underline');
      }

      updateTextStyle.fields = fields.join(',');

      if (fields.length > 0) {
        requests.push({ updateTextStyle });
      }
    }

    if (range.link) {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: range.startIndex,
            endIndex: range.endIndex,
          },
          textStyle: {
            link: { url: range.link },
          },
          fields: 'link',
        },
      });
    }
  }

  return { requests, plainText };
}

/**
 * Update a Google Doc with new markdown content
 */
export async function updateGoogleDoc(
  accessToken: string,
  documentId: string,
  markdown: string
): Promise<{ success: boolean; wordCount: number }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  // First, get the current document to find the content length
  const currentDoc = await docs.documents.get({ documentId });
  const content = currentDoc.data.body?.content || [];
  
  // Find the end index of the document content
  let endIndex = 1;
  for (const element of content) {
    if (element.endIndex && element.endIndex > endIndex) {
      endIndex = element.endIndex;
    }
  }

  // Build requests: first delete all content, then insert new content
  const requests: object[] = [];

  // Delete existing content (if there's content beyond the initial newline)
  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: endIndex - 1,
        },
      },
    });
  }

  // Convert markdown to Google Docs requests
  const { requests: insertRequests, plainText } = markdownToDocRequests(markdown);
  requests.push(...insertRequests);

  // Execute the batch update
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  // Calculate word count from the plain text
  const wordCount = plainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return { success: true, wordCount };
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
