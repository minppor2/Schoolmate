import { NextResponse } from 'next/server';

// 교사 수신 메시지에서 업무(할 일)를 추출한다 (Gemini JSON 모드).
// 클라이언트는 이 API 실패 시 규칙 기반 분석기(lib/analyzer)로 대체한다.
export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const body = await request.json();
    const text = String(body?.text || '').slice(0, 6000);
    if (!text.trim()) {
      return NextResponse.json({ error: '분석할 메시지가 비어 있습니다.' }, { status: 400 });
    }

    const now = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    const week = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    const prompt = `오늘은 ${today} (${week}요일)이다.
아래는 학교 교사가 받은 메시지다. 교사가 처리해야 할 업무(할 일)를 모두 추출해서 JSON으로만 답하라.

규칙:
- title: 20자 이내의 간결한 업무명 (예: "정보보안 교육 이수")
- due: 마감/실시 날짜를 YYYY-MM-DD로. "내일", "다음주 금요일" 같은 상대 날짜는 오늘 기준으로 계산. 알 수 없으면 null
- time: 시각이 명시되면 HH:MM (24시간), 없으면 null
- importance: 마감이 임박하거나 제출/필수/중요 표현이 있으면 "important", 아니면 "normal"
- 업무가 아닌 단순 안내문이면 tasks를 빈 배열로

출력 형식: {"tasks":[{"title":"...","due":"YYYY-MM-DD"|null,"time":"HH:MM"|null,"importance":"important"|"normal"}]}

메시지:
${text}`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1000, temperature: 0.2 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || 'Gemini API 호출 실패' }, { status: res.status });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.map(pt => pt.text).join('') || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      return NextResponse.json({ error: 'AI 응답을 해석하지 못했습니다.' }, { status: 502 });
    }

    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks
      .filter(t => t && typeof t.title === 'string' && t.title.trim())
      .slice(0, 10)
      .map(t => ({
        title: t.title.trim().slice(0, 60),
        due: typeof t.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : null,
        time: typeof t.time === 'string' && /^\d{1,2}:\d{2}$/.test(t.time) ? t.time : null,
        importance: t.importance === 'important' ? 'important' : 'normal',
      })) : [];

    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
