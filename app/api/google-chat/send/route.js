import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { accessToken, space, text } = body || {};

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }
    if (!space || !text) {
      return NextResponse.json({ error: 'Missing space or text' }, { status: 400 });
    }

    const url = `https://chat.googleapis.com/v1/${encodeURI(space)}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data || 'Failed to send message' }, { status: res.status });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
