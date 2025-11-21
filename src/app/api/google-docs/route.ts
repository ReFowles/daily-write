import { auth } from '@/lib/auth';
import { listGoogleDocs, getGoogleDocAsMarkdown } from '@/lib/google-docs';
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
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const markdown = await getGoogleDocAsMarkdown(
      session.accessToken,
      documentId
    );

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Error fetching Google Doc content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document content' },
      { status: 500 }
    );
  }
}
