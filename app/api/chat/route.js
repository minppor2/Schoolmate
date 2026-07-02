import { NextResponse } from 'next/server';

// 스쿨메이트 AI 사이트 전용 챗봇 (OpenAI GPT API)
// OPENAI_API_KEY 환경변수가 필요하다. 모델은 OPENAI_MODEL로 변경 가능 (기본 gpt-4o-mini).
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

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다. Vercel(또는 .env.local)에 OpenAI API 키를 등록하세요.' },
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

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || 'OpenAI API 호출에 실패했습니다.';
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const reply = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
