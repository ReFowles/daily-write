import { google } from 'googleapis';

export interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  ownedByMe: boolean;
}

export interface DocumentTab {
  tabId: string;
  title: string;
  index: number;
  nestingLevel: number;
  parentTabId?: string;
}

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

  // Cast to unknown first then to our interface to handle potentially missing types
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

// Helper interface for body content structure
interface BodyContent {
  content?: Array<{
    paragraph?: {
      elements?: Array<{
        textRun?: {
          content?: string;
          textStyle?: {
            bold?: boolean;
            italic?: boolean;
            underline?: boolean;
            strikethrough?: boolean;
            link?: {
              url?: string;
            };
          };
        };
      }>;
      paragraphStyle?: {
        namedStyleType?: string;
      };
    };
    table?: unknown;
  }>;
}

/**
 * Convert body content to Markdown
 */
function bodyToMarkdown(bodyContent: BodyContent): string {
  let markdown = '';
  const content = bodyContent?.content || [];

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
      const escapeSpecialChars = (text: string): string => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
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

        if (text === '\n') {
          paragraphText += text;
          continue;
        }

        const hasFormatting = run.bold || run.italic || run.underline || run.strikethrough || run.link;
        if (!hasFormatting) {
          paragraphText += escapeSpecialChars(text);
          continue;
        }

        const trimmedText = text.trim();
        if (!trimmedText) {
          paragraphText += text;
          continue;
        }

        const leadingSpace = text.startsWith(' ') ? ' ' : '';
        const trailingSpace = text.endsWith(' ') && text !== ' ' ? ' ' : '';

        let formattedText = escapeSpecialChars(trimmedText);

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
        const cleanText = paragraphText.replace(/\n+$/, '');
        markdown += headingPrefix + cleanText;
        
        if (headingPrefix) {
          markdown += '\n\n';
        } else {
          markdown += '\n';
        }
      } else {
        markdown += '\n';
      }
    } else if (element.table) {
      markdown += '_[Table content]_\n\n';
    }
  }

  return markdown.trim();
}

/**
 * Convert Google Docs content to Markdown
 * @param tabId - Optional tab ID to get content from a specific tab
 */
export async function getGoogleDocAsMarkdown(
  accessToken: string,
  documentId: string,
  tabId?: string
): Promise<string> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  const response = await docs.documents.get({
    documentId,
    includeTabsContent: true,
  });

  const document = response.data;
  
  // If a specific tab is requested, find it and return its content
  if (tabId && document.tabs) {
    interface TabData {
      tabProperties?: {
        tabId?: string | null;
      };
      documentTab?: {
        body?: BodyContent;
      };
      childTabs?: TabData[];
    }
    
    // Helper to find a tab by ID recursively
    const findTab = (tabs: TabData[], targetId: string): TabData | undefined => {
      for (const tab of tabs) {
        if (tab.tabProperties?.tabId === targetId) {
          return tab;
        }
        if (tab.childTabs) {
          const found = findTab(tab.childTabs, targetId);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const targetTab = findTab(document.tabs as unknown as TabData[], tabId);
    if (targetTab?.documentTab?.body) {
      return bodyToMarkdown(targetTab.documentTab.body);
    }
  }
  
  // Default: return first tab's content or legacy body content
  if (document.tabs && document.tabs.length > 0) {
    interface TabData {
      documentTab?: {
        body?: BodyContent;
      };
    }
    const firstTab = document.tabs[0] as unknown as TabData;
    if (firstTab?.documentTab?.body) {
      return bodyToMarkdown(firstTab.documentTab.body);
    }
  }
  
  // Fallback to legacy body content
  return bodyToMarkdown(document.body as BodyContent);
}

/**
 * Convert markdown to Google Docs requests
 * This creates a series of batch update requests to update the document
 * @param tabId - Optional tab ID to target a specific tab
 */
function markdownToDocRequests(
  markdown: string,
  tabId?: string
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
    const location: { index: number; tabId?: string } = { index: 1 };
    if (tabId) {
      location.tabId = tabId;
    }
    requests.push({
      insertText: {
        location,
        text: plainText,
      },
    });
  }

  // Create formatting requests (in reverse order so indices stay valid)
  for (const range of formattingRanges.reverse()) {
    if (range.bold || range.italic || range.strikethrough || range.underline) {
      const rangeObj: { startIndex: number; endIndex: number; tabId?: string } = {
        startIndex: range.startIndex,
        endIndex: range.endIndex,
      };
      if (tabId) {
        rangeObj.tabId = tabId;
      }
      
      const updateTextStyle: {
        range: { startIndex: number; endIndex: number; tabId?: string };
        textStyle: Record<string, boolean>;
        fields: string;
      } = {
        range: rangeObj,
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
      const rangeObj: { startIndex: number; endIndex: number; tabId?: string } = {
        startIndex: range.startIndex,
        endIndex: range.endIndex,
      };
      if (tabId) {
        rangeObj.tabId = tabId;
      }
      
      requests.push({
        updateTextStyle: {
          range: rangeObj,
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
 * @param tabId - Optional tab ID to update content in a specific tab
 */
export async function updateGoogleDoc(
  accessToken: string,
  documentId: string,
  markdown: string,
  tabId?: string
): Promise<{ success: boolean; wordCount: number }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  // First, get the current document to find the content length
  const currentDoc = await docs.documents.get({ 
    documentId,
    includeTabsContent: true,
  });
  
  // Find the end index of the document/tab content
  let endIndex = 1;
  
  if (tabId && currentDoc.data.tabs) {
    // Find the specific tab's content
    interface TabData {
      tabProperties?: {
        tabId?: string | null;
      };
      documentTab?: {
        body?: {
          content?: Array<{ endIndex?: number | null }>;
        };
      };
      childTabs?: TabData[];
    }
    
    const findTab = (tabs: TabData[], targetId: string): TabData | undefined => {
      for (const tab of tabs) {
        if (tab.tabProperties?.tabId === targetId) {
          return tab;
        }
        if (tab.childTabs) {
          const found = findTab(tab.childTabs, targetId);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const targetTab = findTab(currentDoc.data.tabs as unknown as TabData[], tabId);
    const content = targetTab?.documentTab?.body?.content || [];
    
    for (const element of content) {
      if (element.endIndex && element.endIndex > endIndex) {
        endIndex = element.endIndex;
      }
    }
  } else {
    // Use legacy body content
    const content = currentDoc.data.body?.content || [];
    
    for (const element of content) {
      if (element.endIndex && element.endIndex > endIndex) {
        endIndex = element.endIndex;
      }
    }
  }

  // Build requests: first delete all content, then insert new content
  const requests: object[] = [];

  // Delete existing content (if there's content beyond the initial newline)
  if (endIndex > 2) {
    const deleteRange: { startIndex: number; endIndex: number; tabId?: string } = {
      startIndex: 1,
      endIndex: endIndex - 1,
    };
    if (tabId) {
      deleteRange.tabId = tabId;
    }
    requests.push({
      deleteContentRange: {
        range: deleteRange,
      },
    });
  }

  // Convert markdown to Google Docs requests
  const { requests: insertRequests, plainText } = markdownToDocRequests(markdown, tabId);
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
