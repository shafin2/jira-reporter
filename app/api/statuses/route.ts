import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteUrl = searchParams.get('siteUrl')?.replace(/\/$/, '');
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const projectKey = searchParams.get('projectKey');

  if (!siteUrl || !email || !token || !projectKey) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  try {
    const res = await fetch(`${siteUrl}/rest/api/3/project/${projectKey}/statuses`, { headers });
    if (res.status === 401) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.message || `Jira error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    // data is an array of issue types, each with a .statuses array — deduplicate by name
    const seen = new Set<string>();
    const statuses: string[] = [];
    for (const issueType of data) {
      for (const s of issueType.statuses ?? []) {
        if (!seen.has(s.name)) {
          seen.add(s.name);
          statuses.push(s.name);
        }
      }
    }

    return NextResponse.json({ statuses });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
