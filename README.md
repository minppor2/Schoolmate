# 스쿨메이트 AI

교사 업무 자동화 플랫폼 — 창일중학교. Next.js(App Router) + Firebase로 만든 웹 앱입니다.

배포: https://schoolmate-q9jb.vercel.app

## 주요 기능

- **홈** — 업무·일정·예약·도구가 노드로 연결된 그래프(옵시디언 스타일, 드래그·물리 시뮬레이션)와 포스트잇 메모 보드
- **업무함** — 받은 메시지/공문을 붙여넣으면 AI(Gemini)가 여러 업무를 마감일·중요도와 함께 추출. 저장/완료/무시·복구, D-day 표시, Google 캘린더·일정·특별실 연계
- **일정** — 메시지 분석으로 일정 생성, Google 캘린더에 추가, 업무함에서 불러오기
- **특별실 예약** — 날짜별 예약표, 학교별 특별실/교시 설정, 로그인 시 교사끼리 실시간 공유(Firestore)
- **학생기록 도우미** — 자주 쓰는 웹페이지를 카드로 등록하는 개인 포털. CLASS PLAY HUB(발표자 뽑기·자리 뽑기·타이머) 기본 제공
- **AI 챗봇** — 사이트 사용법·교사 업무를 돕는 챗봇(Gemini 무료 API, OpenAI 대체 지원)
- **알림 센터** — 마감 임박 업무/오늘 일정/오늘 예약을 접속 시 자동 팝업 + 상단바 배지
- 이용약관·개인정보처리방침·사용방법 안내 팝업, 반응형(모바일 하단 탭바)

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

## 환경변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다. (Vercel 배포 시에는
프로젝트 Settings > Environment Variables에 동일하게 등록 후 Redeploy)

```bash
# Firebase (콘솔 > 프로젝트 설정 > 내 앱 > SDK 구성)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google OAuth (Google Chat 연동 토큰 발급용, 선택)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 테스트 사용자 입장 비밀번호 (심사/체험용, 로그인 없이 입장)
ADMIN_PASSWORD=

# AI 챗봇/업무 추출 — 둘 중 하나 이상 (Gemini 우선, 무료)
GEMINI_API_KEY=   # https://aistudio.google.com/apikey (무료)
OPENAI_API_KEY=   # https://platform.openai.com/api-keys (유료)
```

## Firebase 설정

1. **Authentication** > 로그인 방법에서 **Google** 제공업체 사용 설정
2. **Authentication** > 설정 > 승인된 도메인에 배포 도메인(`schoolmate-q9jb.vercel.app`) 추가
3. **Firestore Database** 생성 후, 규칙 탭에 저장소의 [`firestore.rules`](firestore.rules) 내용 적용

## 기술 스택

Next.js 16 (App Router) · React 19 · Firebase(Auth·Firestore) · Google Gemini API · Material Symbols
