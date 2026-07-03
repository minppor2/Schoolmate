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

// NEIS 방식 바이트 수 (한글 등 비ASCII 3바이트, 영문·숫자·공백 1바이트)
export function neisBytes(text) {
  let bytes = 0;
  for (const ch of String(text || '')) bytes += ch.charCodeAt(0) > 127 ? 3 : 1;
  return bytes;
}

// 세특 관행 문체: 명사형 종결(~함, ~임). 서술형 종결어미가 있으면 확인 필요.
const STYLE_PATTERN = /(?:했다|한다|이다|였다|이었다|입니다|합니다|됩니다|습니다|았다|었다)(?=[\s.,)!?"']|$)/g;

// 텍스트 1건 점검.
// opts: { name: 학생 이름(본문 포함 검출용), customWords: [학교 금칙어], countMode: 'char'|'byte' }
// 반환: { length, bytes, max, maxBytes, overLimit, issues: [{id, category, severity, desc, matches}] }
export function checkText(text, max, opts = {}) {
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

  // 문체(종결어미) 검사
  const styleMatches = t.match(STYLE_PATTERN);
  if (styleMatches && styleMatches.length) {
    issues.push({
      id: 'style',
      category: '문체(종결어미)',
      severity: 'warn',
      desc: '세특은 명사형 종결(~함, ~임, ~보임)이 관행입니다. 서술형 종결어미가 발견되었습니다.',
      matches: [...new Set(styleMatches)].slice(0, 8),
    });
  }

  // 본문 속 학생 이름 검출
  const name = String(opts.name || '').trim();
  if (name.length >= 2 && t.includes(name)) {
    issues.push({
      id: 'student-name',
      category: '학생 이름 포함',
      severity: 'warn',
      desc: '본문에 학생 이름이 들어 있습니다. 생활기록부 서술형 항목에는 이름을 기재하지 않는 것이 원칙입니다.',
      matches: [name],
    });
  }

  // 학교 커스텀 금칙어
  const custom = (opts.customWords || []).filter(w => w && w.length >= 1);
  if (custom.length) {
    const found = custom.filter(w => t.includes(w));
    if (found.length) {
      issues.push({
        id: 'custom',
        category: '학교 금칙어',
        severity: 'warn',
        desc: '학교에서 직접 등록한 금칙어가 발견되었습니다.',
        matches: found.slice(0, 8),
      });
    }
  }

  const bytes = neisBytes(t);
  const maxBytes = max ? max * 3 : 0;
  const overLimit = max
    ? (opts.countMode === 'byte' ? bytes > maxBytes : t.length > max)
    : false;

  return { length: t.length, bytes, max, maxBytes, overLimit, issues };
}

// 학생 간 유사 문장 검사 (2-gram Dice 유사도). threshold 이상인 쌍을 반환.
export function similarPairs(texts, threshold = 0.8) {
  const grams = texts.map(t => {
    const s = String(t || '').replace(/\s+/g, '');
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  });
  const pairs = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = grams[i], b = grams[j];
      if (a.size < 5 || b.size < 5) continue;
      let inter = 0;
      const [small, big] = a.size < b.size ? [a, b] : [b, a];
      small.forEach(g => { if (big.has(g)) inter++; });
      const score = (2 * inter) / (a.size + b.size);
      if (score >= threshold) pairs.push({ i, j, score });
    }
  }
  return pairs.sort((x, y) => y.score - x.score).slice(0, 100);
}

// 이름 마스킹: 홍길동 → 홍*동, 홍길 → 홍*, 외자·빈값은 그대로 처리
export function maskName(name) {
  const n = String(name || '').trim();
  if (n.length <= 1) return n || '-';
  if (n.length === 2) return n[0] + '*';
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1];
}
