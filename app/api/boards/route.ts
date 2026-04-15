import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteUrl = searchParams.get('siteUrl')?.replace(/\/$/, '');
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!siteUrl || !email || !token) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  try {
    // Get all agile boards
    const res = await fetch(`${siteUrl}/rest/agile/1.0/board?maxResults=50`, { headers });
    if (res.status === 401) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.message || `Jira error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const boards = (data.values || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      projectKey: b.location?.projectKey || '',
      projectName: b.location?.projectName || b.name,
    }));

    return NextResponse.json({ boards });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
