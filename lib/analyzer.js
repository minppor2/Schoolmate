import * as chrono from 'chrono-node';

export function parseMessageForTask(text) {
  if (!text || typeof text !== 'string') return { isTask: false };

  // Simple heuristic: lines containing 날짜/일/요일/시/분 keywords are tasks
  let isTask = /\b(일정|약속|회의|상담|확인|해야|해주세요)\b/.test(text) || /\d{1,2}월|\d{1,2}일|오전|오후|시|분|오늘|내일|모레/.test(text);

  // Preprocess simple Korean relative time expressions (오늘/내일/모레 오전/오후 10시 등)
  let date = null;
  const korMatch = text.match(/(오늘|내일|모레)\s*(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (korMatch) {
    const when = korMatch[1];
    const ampm = korMatch[2];
    const hour = parseInt(korMatch[3], 10);
    const minute = korMatch[4] ? parseInt(korMatch[4], 10) : 0;

    const base = new Date();
    if (when === '내일') base.setDate(base.getDate() + 1);
    if (when === '모레') base.setDate(base.getDate() + 2);

    let hh = hour;
    if (ampm === '오후' && hh < 12) hh += 12;
    if (ampm === '오전' && hh === 12) hh = 0;

    base.setHours(hh, minute, 0, 0);
    date = base;
  } else {
    // Try explicit month/day like "7월 5일 오후 3시"
    const md = text.match(/(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
    if (md) {
      const month = parseInt(md[1], 10) - 1;
      const day = parseInt(md[2], 10);
      const ampm = md[3];
      const hour = parseInt(md[4], 10);
      const minute = md[5] ? parseInt(md[5], 10) : 0;
      const now = new Date();
      const d = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);
      let hh = hour;
      if (ampm === '오후' && hh < 12) hh += 12;
      if (ampm === '오전' && hh === 12) hh = 0;
      d.setHours(hh, minute, 0, 0);
      date = d;
    } else {
      // Handle "다음주 월요일" etc.
      const dowMatch = text.match(/(다음주|이번주)?\s*(월요일|화요일|수요일|목요일|금요일|토요일|일요일)/);
      if (dowMatch) {
        const when = dowMatch[1];
        const dayName = dowMatch[2];
        const mapping = { 월요일:1, 화요일:2, 수요일:3, 목요일:4, 금요일:5, 토요일:6, 일요일:0 };
        const targetDow = mapping[dayName];
        const now = new Date();
        const todayDow = now.getDay();
        let daysAhead = (targetDow - todayDow + 7) % 7;
        if (when === '다음주' || daysAhead === 0) daysAhead += 7;
        const d = new Date(now);
        d.setDate(now.getDate() + daysAhead);
        // Use configured default hour if available, otherwise 9
        const defaultHour = parseInt(process.env.DEFAULT_MEETING_HOUR || process.env.NEXT_PUBLIC_DEFAULT_MEETING_HOUR || '9', 10) || 9;
        d.setHours(defaultHour, 0, 0, 0);
        date = d;
      } else {
        const results = chrono.parse(text, new Date());
        date = results[0]?.start?.date() || null;
      }
    }
  }

  // If a date was found, consider it a task even if no keyword matched
  if (date && !isTask) isTask = true;

  const title = text.length > 120 ? text.slice(0, 117) + '...' : text;

  return {
    isTask,
    title,
    date: date ? date.toISOString() : null,
    raw: text,
  };
}

export default parseMessageForTask;
