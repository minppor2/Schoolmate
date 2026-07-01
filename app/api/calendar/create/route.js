import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { accessToken, title, startISO, endISO, description } = body || {};

    if (!accessToken) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    if (!title || !startISO) return NextResponse.json({ error: 'Missing title or start time' }, { status: 400 });

    const event = {
      summary: title,
      description: description || '',
      start: { dateTime: startISO },
      end: { dateTime: endISO || new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString() },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });

    return NextResponse.json({ ok: true, event: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
