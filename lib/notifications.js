// 앱 내 알림 수집: 업무함 마감 임박, 오늘 일정, 오늘 특별실 예약.
// 모든 데이터는 각 페이지가 쓰는 localStorage 키에서 읽는다 (클라이언트 전용).
import { ddayInfo, resolveStart } from './scheduleUtils';

export const NOTI_SETTINGS_KEY = 'noti_settings';
export const NOTI_LAST_SHOWN_KEY = 'noti_last_shown';

export const DEFAULT_NOTI_SETTINGS = {
  enabled: true,     // 알림 기능 전체 on/off
  autoPopup: true,   // 접속 시 하루 1회 자동 팝업
  days: 3,           // 마감 며칠 전부터 알릴지 (D-days)
};

export function loadNotiSettings() {
  try {
    const raw = localStorage.getItem(NOTI_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_NOTI_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT_NOTI_SETTINGS };
}

export function saveNotiSettings(settings) {
  try { localStorage.setItem(NOTI_SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
}

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isToday(item) {
  const start = resolveStart(item);
  if (!start) return false;
  const now = new Date();
  return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
}

// 알림 목록: [{ id, icon, title, detail, link, urgent }]
export function collectNotifications(settings = loadNotiSettings()) {
  if (!settings.enabled) return [];
  const items = [];

  // 1) 업무함: 저장한 업무 중 미완료 & 마감 임박/지연
  try {
    const tasks = JSON.parse(localStorage.getItem('inbox_tasks') || '[]');
    tasks.filter(t => t.status === 'saved' && !t.done).forEach(t => {
      const info = ddayInfo(t);
      if (!info) return;
      const daysLeft = info.overdue ? -1 : parseInt(info.label.replace('D-', ''), 10) || 0;
      if (info.overdue || info.today || (daysLeft > 0 && daysLeft <= settings.days)) {
        items.push({
          id: `task_${t.id}`,
          icon: 'assignment_late',
          title: t.title,
          detail: info.overdue ? `마감 지남 (${info.label})` : info.today ? '오늘 마감!' : `마감 ${info.label}`,
          link: '/inbox',
          urgent: info.overdue || info.today,
        });
      }
    });
  } catch (e) {}

  // 2) 일정: 오늘 일정
  try {
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    schedules.filter(isToday).forEach(s => {
      items.push({
        id: `sch_${s.id}`,
        icon: 'event',
        title: s.title,
        detail: `오늘 일정${s.time && s.time !== '미정' ? ` · ${s.time}` : ''}`,
        link: '/schedule',
        urgent: false,
      });
    });
  } catch (e) {}

  // 3) 특별실: 오늘 예약 현황
  try {
    const raw = localStorage.getItem(`resv_${todayStr()}`);
    const resv = raw ? JSON.parse(raw) : {};
    const entries = Object.entries(resv);
    entries.slice(0, 5).forEach(([key, r]) => {
      const [room, period] = key.split('||');
      items.push({
        id: `resv_${key}`,
        icon: 'school',
        title: `${room} ${period}`,
        detail: `오늘 예약 · ${r.name}${r.note ? ` (${r.note})` : ''}`,
        link: '/reservation',
        urgent: false,
      });
    });
  } catch (e) {}

  // 긴급(마감 지남/오늘) 먼저
  return items.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}
