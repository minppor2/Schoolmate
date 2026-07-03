'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { NAV_ITEMS } from '@/lib/navItems';

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notiCount, setNotiCount] = useState(0);
  const [query, setQuery] = useState('');
  const [chatConnected, setChatConnected] = useState(false);

  useEffect(() => {
    const onCount = (e) => setNotiCount(e.detail || 0);
    window.addEventListener('noti-count', onCount);
    // Google Chat 연동 여부 = 저장된 access token 존재 여부
    try { setChatConnected(!!localStorage.getItem('google_access_token')); } catch (e) {}
    return () => window.removeEventListener('noti-count', onCount);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // 검색: 메뉴 이름/경로 키워드로 페이지 이동
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit = NAV_ITEMS.find(item =>
      item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
    );
    if (hit) {
      router.push(hit.path);
      setQuery('');
    } else {
      alert(`"${query}"에 해당하는 메뉴를 찾지 못했습니다. (업무함, 일정, 특별실, 학생기록, 설정)`);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">스쿨메이트 AI</h1>
        <span className="topbar-school">창일중학교</span>
      </div>

      <div className="topbar-right">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="메뉴 검색 (예: 일정)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="status-indicator" title={chatConnected ? 'Google Chat 토큰이 연동되어 있습니다' : 'Google Chat 미연동'}>
          <span className="status-dot" style={{ background: chatConnected ? 'var(--color-status-green)' : 'var(--color-hairline)' }}></span>
          {chatConnected ? 'Chat 연동됨' : 'Chat 미연동'}
        </div>
        <button
          className="icon-button"
          aria-label="알림"
          onClick={() => window.dispatchEvent(new CustomEvent('noti-open'))}
          style={{ position: 'relative' }}
        >
          <Icon name="notifications" size={22} />
          {notiCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -4,
              minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 999, background: 'var(--color-status-red)', color: 'white',
              fontSize: 10.5, fontWeight: 700, lineHeight: '16px', textAlign: 'center',
            }}>{notiCount > 9 ? '9+' : notiCount}</span>
          )}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#6E6E73' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: '#F5F5F7',
                border: '1px solid #E0E0E0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#1D1D1F',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#E8E8E8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#F5F5F7'}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
