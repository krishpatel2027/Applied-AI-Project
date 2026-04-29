import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/search';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email || 'guest';

  try {
    const results = await searchImages(query, userEmail);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
