import { NextResponse } from 'next/server';

// 스쿨메이트 AI 사이트 전용 챗봇
// GEMINI_API_KEY가 있으면 Google Gemini(무료 한도 제공)를 우선 사용하고,
// 없으면 OPENAI_API_KEY(OpenAI GPT)를 사용한다.
// 모델 변경: GEMINI_MODEL (기본 gemini-2.5-flash), OPENAI_MODEL (기본 gpt-4o-mini)
const SYSTEM_PROMPT = `너는 교사 업무 자동화 플랫폼 '스쿨메이트 AI'의 안내 챗봇이야.
친절하고 간결하게 한국어로 답해. 이 사이트의 기능은 다음과 같아:

- 로그인: 첫 화면에서 Google 계정으로 로그인. 심사/체험용은 '테스트 사용자 입장'에서 관리자 비밀번호 입력.
- 업무함(/inbox): 수신 메시지에서 업무 후보를 골라 저장하거나 무시.
- 일정(/schedule): 일정 확인 및 생성.
- 특별실 예약(/reservation): 날짜를 선택해 특별실을 교시별로 예약. '⚙ 특별실·교시 설정'에서 우리 학교에 맞게 특별실과 교시 목록을 수정 가능.
- 학생기록 도우미(/records): '내 자료실' 탭에서 자주 쓰는 웹페이지를 카드로 등록하는 개인 포털. CLASS PLAY HUB(발표자 뽑기, 자리 뽑기, 타이머)가 기본 제공.
- 설정(/settings): 앱 설정.
- 푸터: 이용약관, 개인정보처리방침, 사용방법 안내 팝업과 GitHub 소스코드 링크.
- 데이터: 로그인 시 Firebase 클라우드에 저장, 비로그인 시 브라우저에만 저장.

사이트 사용법 질문에는 위 내용을 근거로 구체적으로 안내하고,
수업 준비·학급 운영 등 교사 업무 관련 질문에도 도움을 줘.
모르는 것은 모른다고 답하고, 학생 개인정보는 입력하지 말라고 안내해.`;

async function askGemini(apiKey, messages) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message || 'Gemini API 호출에 실패했습니다.'), { status: res.status });
  }
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

async function askOpenAI(apiKey, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 700,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message || 'OpenAI API 호출에 실패했습니다.'), { status: res.status });
  }
  return data?.choices?.[0]?.message?.content || '';
}

export async function POST(request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. GEMINI_API_KEY(무료, aistudio.google.com/apikey) 또는 OPENAI_API_KEY를 등록하세요.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      return NextResponse.json({ error: '메시지가 비어 있습니다.' }, { status: 400 });
    }

    // 최근 12개 메시지만 전달해 토큰 사용을 제한
    const trimmed = messages.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }));

    let reply;
    if (geminiKey) {
      try {
        reply = await askGemini(geminiKey, trimmed);
      } catch (err) {
        // Gemini 실패 시 OpenAI 키가 있으면 대체 시도
        if (!openaiKey) throw err;
        reply = await askOpenAI(openaiKey, trimmed);
      }
    } else {
      reply = await askOpenAI(openaiKey, trimmed);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: err.status || 500 });
  }
}
