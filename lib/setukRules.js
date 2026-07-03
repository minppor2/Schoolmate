// 학교생활기록부 서술형 항목(세특 등) 점검 규칙.
// 근거: 「2026학년도 학교생활기록부 기재 길라잡이(중학교)」 기재불가 사항(p.18~19),
//       세부능력 및 특기사항 입력 불가 항목(p.104), 입력 가능 최대 글자수(참고자료).

export const LIMITS = [
  { id: 'subject', label: '과목별 세부능력 및 특기사항', max: 500 },
  { id: 'personal', label: '개인별 세부능력 및 특기사항', max: 500 },
  { id: 'autonomy', label: '자율활동 특기사항', max: 500 },
  { id: 'club', label: '동아리활동 특기사항', max: 500 },
  { id: 'career', label: '진로활동 특기사항', max: 700 },
  { id: 'behavior', label: '행동특성 및 종합의견', max: 500 },
  { id: 'volunteer', label: '봉사활동 실적 활동내용', max: 250 },
];

// severity: 'error' = 명백한 기재불가, 'warn' = 문맥 확인 필요
export const RULES = [
  {
    id: 'lang-test', severity: 'error', category: '공인어학시험',
    desc: '각종 공인어학시험 참여 사실과 성적·수상 실적은 모든 항목에 기재 불가',
    pattern: /TOEIC|TOEFL|TEPS|HSK|JPT|JLPT|DELF|DALF|TESTDAF|DSH|DSD|TORFL|DELE|토익|토플|텝스|한자능력검정|한자급수|상공회의소\s?한자|YBM\s?상무한검/gi,
  },
  {
    id: 'contest', severity: 'warn', category: '대회·수상',
    desc: '교내·외 대회 참여 사실과 성적·수상실적은 세특에 기재 불가 (교내대회는 수상경력 항목에만, 대회명을 행사로 바꿔 쓰는 것도 불가)',
    pattern: /대회|수상|입상|올림피아드|경시|공모전|콘테스트|최우수상|우수상|장려상|금상|은상|동상/g,
  },
  {
    id: 'cert', severity: 'error', category: '자격증',
    desc: '자격증 명칭 및 취득 사실 기재 불가',
    pattern: /자격증|워드프로세서|컴퓨터활용능력|ITQ|GTQ|DIAT/g,
  },
  {
    id: 'cert-exam', severity: 'warn', category: '인증시험',
    desc: '교내·외 인증시험 참여 사실이나 그 성적 기재 불가',
    pattern: /인증\s?시험/g,
  },
  {
    id: 'paper', severity: 'error', category: '논문·연구보고서',
    desc: '논문 투고·등재·학회 발표 사실, 연구보고서(소논문) 작성 관련 사항 기재 불가',
    pattern: /논문|학회|연구\s?보고서/g,
  },
  {
    id: 'book', severity: 'warn', category: '도서 출간',
    desc: '도서 출간 사실 기재 불가',
    pattern: /출간|출판/g,
  },
  {
    id: 'patent', severity: 'error', category: '지식재산권',
    desc: '특허·실용신안·상표·디자인 출원 또는 등록 사실 기재 불가',
    pattern: /특허|실용신안|지식재산권/g,
  },
  {
    id: 'abroad', severity: 'warn', category: '해외 활동',
    desc: '어학연수, 해외 봉사 등 해외 활동실적 및 관련 내용 기재 불가',
    pattern: /어학연수|해외\s?봉사|해외\s?연수|해외\s?캠프/g,
  },
  {
    id: 'parents', severity: 'warn', category: '부모 지위 암시',
    desc: '부모(친인척 포함)의 사회·경제적 지위(직종·직업·직장·직위) 암시 내용 기재 불가',
    pattern: /아버지|어머니|아빠|엄마|부모님|삼촌|이모부?|고모부?/g,
  },
  {
    id: 'scholarship', severity: 'error', category: '장학',
    desc: '장학생·장학금 관련 내용 기재 불가',
    pattern: /장학금|장학생/g,
  },
  {
    id: 'org', severity: 'warn', category: '대학·기관·상호명',
    desc: '구체적인 특정 대학명·기관명·상호명·강사명 기재 불가 (교육관련기관은 예외)',
    pattern: /대학교|대학원|학원|강사/g,
  },
  {
    id: 'mooc', severity: 'error', category: 'MOOC',
    desc: 'K-MOOC, MOOC, KOCW 등 관련 사항은 세특에 기재 불가',
    pattern: /K-?MOOC|KOCW|MOOC/gi,
  },
  {
    id: 'afterschool', severity: 'error', category: '방과후학교',
    desc: '방과후학교 활동은 세특에 기재 불가',
    pattern: /방과\s?후/g,
  },
  {
    id: 'gifted', severity: 'warn', category: '영재·발명교육',
    desc: '영재교육기관·발명교육센터의 구체적 명칭은 기재 불가 (이수 사실은 지정 형식으로만)',
    pattern: /영재\s?교육원|영재\s?학급|영재\s?학교|발명\s?교육\s?센터/g,
  },
  {
    id: 'privacy-rrn', severity: 'error', category: '개인정보',
    desc: '주민등록번호로 보이는 숫자 패턴 발견 — 즉시 삭제 필요',
    pattern: /\d{6}\s?-\s?\d{7}/g,
  },
  {
    id: 'privacy-phone', severity: 'warn', category: '개인정보',
    desc: '전화번호로 보이는 숫자 패턴 발견 — 확인 필요',
    pattern: /01[016789]\s?-?\s?\d{3,4}\s?-?\s?\d{4}/g,
  },
];

// 텍스트 1건 점검: { length, max, overLimit, issues: [{id, category, severity, desc, matches}] }
export function checkText(text, max) {
  const t = String(text || '');
  const issues = [];
  RULES.forEach(rule => {
    const matches = t.match(rule.pattern);
    if (matches && matches.length) {
      issues.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        desc: rule.desc,
        matches: [...new Set(matches)].slice(0, 8),
      });
    }
  });
  return {
    length: t.length,
    max,
    overLimit: max ? t.length > max : false,
    issues,
  };
}

// 이름 마스킹: 홍길동 → 홍*동, 홍길 → 홍*, 외자·빈값은 그대로 처리
export function maskName(name) {
  const n = String(name || '').trim();
  if (n.length <= 1) return n || '-';
  if (n.length === 2) return n[0] + '*';
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1];
}
