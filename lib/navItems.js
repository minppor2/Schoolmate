// 사이드바(데스크톱)와 하단 탭바(모바일)가 공유하는 내비게이션 항목
export const NAV_ITEMS = [
  { name: '홈', path: '/', icon: 'home' },
  { name: '업무함', path: '/inbox', icon: 'inbox' },
  { name: '일정', path: '/schedule', icon: 'calendar_month' },
  { name: '특별실', path: '/reservation', icon: 'school' },
  { name: '학생기록', path: '/records', icon: 'edit_note' },
  { name: '설정', path: '/settings', icon: 'settings' },
];

// 현재 경로가 해당 항목인지 (홈은 정확히 일치할 때만)
export function isActivePath(itemPath, pathname) {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}
