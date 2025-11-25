import { auth } from '@/lib/auth';
import { 
  listGoogleDocs, 
  getGoogleDocAsMarkdown, 
  updateGoogleDoc, 
  createGoogleDoc,
  getDocumentTabs,
} from '@/lib/google-docs';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const docs = await listGoogleDocs(session.accessToken);
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('Error fetching Google Docs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle different actions
    switch (body.action) {
      case 'create': {
        const { title } = body;

        if (!title || typeof title !== 'string') {
          return NextResponse.json(
            { error: 'Document title is required' },
            { status: 400 }
          );
        }

        const newDoc = await createGoogleDoc(session.accessToken, title);
        return NextResponse.json({ doc: newDoc });
      }

      case 'getTabs': {
        const { documentId } = body;

        if (!documentId) {
          return NextResponse.json(
            { error: 'Document ID is required' },
            { status: 400 }
          );
        }

        const tabs = await getDocumentTabs(session.accessToken, documentId);
        return NextResponse.json({ tabs });
      }

      // NOTE: The Google Docs API does NOT support creating, deleting, or renaming tabs.
      // Tabs are read-only via the API. Users must manage tabs directly in Google Docs.

      default: {
        // Default behavior: get document content
        const { documentId, tabId } = body;

        if (!documentId) {
          return NextResponse.json(
            { error: 'Document ID is required' },
            { status: 400 }
          );
        }

        const markdown = await getGoogleDocAsMarkdown(
          session.accessToken,
          documentId,
          tabId
        );

        return NextResponse.json({ markdown });
      }
    }
  } catch (error) {
    console.error('Error processing Google Doc request:', error);
    return NextResponse.json(
      { error: 'Failed to process document request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId, markdown, tabId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    const result = await updateGoogleDoc(
      session.accessToken,
      documentId,
      markdown,
      tabId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating Google Doc:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
