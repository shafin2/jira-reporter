import { NextRequest, NextResponse } from 'next/server';

function getDateRange(timeline: string): { from: string; label: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  switch (timeline) {
    case 'today':
      return { from: fmt(now), label: 'Today' };
    case '2days': {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { from: fmt(d), label: 'Last 2 days' };
    }
    case '3days': {
      const d = new Date(now); d.setDate(d.getDate() - 2);
      return { from: fmt(d), label: 'Last 3 days' };
    }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { from: fmt(d), label: 'This week' };
    }
    default:
      return { from: fmt(now), label: 'Today' };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { siteUrl, email, token, projectKey, statusColumns, timeline } = body;

  if (!siteUrl || !email || !token || !projectKey || !statusColumns?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  const { from, label } = getDateRange(timeline || 'today');

  // Build JQL: tickets I moved to any of the selected statuses on or after the start date
  const statusChangedClauses = statusColumns.map((s: string) =>
    `status changed to "${s}" by currentUser() after "${from}"`
  ).join(' OR ');

  const jql = `project = "${projectKey}" AND (${statusChangedClauses}) ORDER BY updated DESC`;
  console.log('[jira] JQL:', jql);

  try {
    const url = `${siteUrl.replace(/\/$/, '')}/rest/api/3/search/jql`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jql,
        fields: ['summary', 'status', 'project', 'timespent', 'issuetype', 'assignee', 'updated'],
        maxResults: 100,
      }),
    });

    if (res.status === 401) return NextResponse.json({ error: 'Invalid credentials — check your API token' }, { status: 401 });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errorMessages?.[0] || `Jira error ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const tickets = (data.issues || []).map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || '',
      timespent: issue.fields.timespent || null,
      projectKey: issue.fields.project?.key || '',
      projectName: issue.fields.project?.name || '',
      issueType: issue.fields.issuetype?.name || '',
      assignee: issue.fields.assignee?.displayName || '',
      updated: issue.fields.updated,
    }));

    return NextResponse.json({ tickets, timelineLabel: label });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
