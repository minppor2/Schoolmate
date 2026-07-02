import { NextResponse } from 'next/server';

// 테스트 사용자 입장: 관리자 비밀번호(서버 환경변수 ADMIN_PASSWORD)와 일치하면 통과.
// 비밀번호는 서버에서만 비교하므로 클라이언트 번들에 노출되지 않는다.
export async function POST(request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: '관리자 비밀번호가 설정되지 않았습니다. (ADMIN_PASSWORD 환경변수)' }, { status: 500 });
    }

    const body = await request.json();
    const { password } = body || {};
    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
