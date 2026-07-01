import { NextResponse } from 'next/server';
import { parseMessageForTask } from '@/lib/analyzer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { text } = body || {};
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const result = parseMessageForTask(text);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
