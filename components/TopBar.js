'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">스쿨메이트 AI</h1>
        <span className="topbar-school">창일중학교</span>
      </div>
      
      <div className="topbar-right">
        <div className="search-bar">
          <input type="text" placeholder="검색..." />
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span> Chat 연동됨
        </div>
        <button className="icon-button" aria-label="알림"><Icon name="notifications" size={22} /></button>
        
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
