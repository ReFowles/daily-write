import { auth } from '@/lib/auth';
import { listGoogleDocs } from '@/lib/google-docs';
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
