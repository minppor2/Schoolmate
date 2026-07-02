'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Icon from './Icon';
import { collectNotifications, loadNotiSettings, NOTI_LAST_SHOWN_KEY } from '@/lib/notifications';

// 알림 센터: 접속 시 하루 1회 자동 팝업 + 상단바 종(🔔) 버튼으로 열기.
// TopBar와는 커스텀 이벤트로 통신한다: 'noti-open'(열기 요청), 'noti-count'(배지 개수 전달)
export default function NotificationCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  function refresh() {
    const settings = loadNotiSettings();
    const list = settings.enabled ? collectNotifications(settings) : [];
    setItems(list);
    window.dispatchEvent(new CustomEvent('noti-count', { detail: list.length }));
    return { settings, list };
  }

  useEffect(() => {
    const { settings, list } = refresh();

    // 하루 1회 자동 팝업
    const today = new Date().toDateString();
    let lastShown = null;
    try { lastShown = localStorage.getItem(NOTI_LAST_SHOWN_KEY); } catch (e) {}
    if (settings.enabled && settings.autoPopup && list.length > 0 && lastShown !== today && pathname !== '/login') {
      setOpen(true);
    }

    const onOpen = () => { refresh(); setOpen(true); };
    window.addEventListener('noti-open', onOpen);
    return () => window.removeEventListener('noti-open', onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function dismissToday() {
    try { localStorage.setItem(NOTI_LAST_SHOWN_KEY, new Date().toDateString()); } catch (e) {}
    setOpen(false);
  }

  if (!open || pathname === '/login') return null;

  return (
    <div
      role="dialog"
      aria-label="알림"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 10500,
        width: 'min(360px, calc(100vw - 40px))',
        maxHeight: 'min(480px, calc(100vh - 100px))',
        background: 'white',
        borderRadius: 14,
        border: '1px solid var(--color-hairline)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', background: 'var(--color-pearl)' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="notifications" size={19} filled /> 알림 {items.length > 0 ? `(${items.length})` : ''}
        </strong>
        <button onClick={() => setOpen(false)} aria-label="닫기" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-ink)' }}>
          <Icon name="close" size={20} />
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {items.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted-ink)', fontSize: 14 }}>새 알림이 없습니다.</p>
        ) : items.map(item => (
          <button
            key={item.id}
            onClick={() => { setOpen(false); router.push(item.link); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-divider)',
              cursor: 'pointer',
            }}
          >
            <Icon name={item.icon} size={22} style={{ color: item.urgent ? 'var(--color-status-red)' : 'var(--color-primary)' }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: item.urgent ? 'var(--color-status-red)' : 'var(--color-muted-ink)' }}>{item.detail}</span>
            </span>
            <Icon name="chevron_right" size={18} style={{ color: 'var(--color-muted-ink)' }} />
          </button>
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={dismissToday} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--color-muted-ink)', textDecoration: 'underline' }}>
          오늘 하루 그만 보기
        </button>
        <button onClick={() => { setOpen(false); router.push('/settings'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--color-primary)' }}>
          알림 설정
        </button>
      </div>
    </div>
  );
}
