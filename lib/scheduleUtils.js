// 일정/업무 공용 날짜 도우미.
// 앱이 표시하는 날짜 문자열("오늘", "7월 3일", "2026.07.03" 등)을 다루고
// Google 캘린더 등록 URL(템플릿 방식, 로그인 불필요)을 만든다.

export function parseDisplayDate(dateStr) {
  const text = String(dateStr || '');
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (text.includes('오늘')) return base;
  if (text.includes('내일')) { base.setDate(base.getDate() + 1); return base; }
  if (text.includes('모레')) { base.setDate(base.getDate() + 2); return base; }
  const md = text.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (md) return new Date(md[1] ? +md[1] : now.getFullYear(), +md[2] - 1, +md[3]);
  const parsed = new Date(text);
  if (!isNaN(parsed)) return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return null;
}

export function toGCalStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

// {title, date, time, startISO}를 받아 시작 시각 Date를 계산 (실패 시 null)
export function resolveStart(item) {
  let start = item.startISO ? new Date(item.startISO) : null;
  if (!start || isNaN(start)) {
    start = parseDisplayDate(item.date);
    if (start) {
      const tm = /^(\d{1,2}):(\d{2})$/.exec(item.time || '');
      start.setHours(tm ? +tm[1] : 9, tm ? +tm[2] : 0, 0, 0);
    }
  }
  return start && !isNaN(start) ? start : null;
}

export function gcalUrl(item) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: item.title, details: '스쿨메이트 AI에서 추가한 일정' });
  const start = resolveStart(item);
  if (start) {
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    params.set('dates', `${toGCalStamp(start)}/${toGCalStamp(end)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// D-day 라벨: { label: 'D-3' | 'D-DAY' | 'D+2', overdue, today } 또는 null(날짜 없음)
export function ddayInfo(item) {
  const start = resolveStart(item);
  if (!start) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diff = Math.round((target - today) / 86400000);
  return {
    label: diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${-diff}`,
    overdue: diff < 0,
    today: diff === 0,
  };
}
