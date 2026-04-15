import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { webhookUrl, message } = await req.json();

  if (!webhookUrl || !message) {
    return NextResponse.json({ error: 'Missing webhookUrl or message' }, { status: 400 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Slack error: ${text}` }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
