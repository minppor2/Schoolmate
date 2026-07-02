'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserGuide } from '@/components/LegalDocs';
import Icon from '@/components/Icon';

function LoginContent() {
  const { user, loading, googleLogin, guestLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestPassword, setGuestPassword] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);

  useEffect(() => {
    // Google Chat 연동 콜백으로 전달된 토큰은 조용히 저장한다 (UI 없음)
    const callbackToken = searchParams.get('token');
    const callbackError = searchParams.get('error');

    if (callbackError) {
      setErrorMessage(callbackError);
    }

    if (callbackToken) {
      localStorage.setItem('google_access_token', callbackToken);
      router.push('/inbox');
      return;
    }

    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router, searchParams]);

  // 기본 로그인: Firebase Authentication (Google 계정)
  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      router.push('/');
    } catch (error) {
      alert('로그인 실패: ' + error.message);
    }
  };

  // 테스트 사용자 입장 (관리자 비밀번호)
  const handleGuestLogin = async () => {
    if (!guestPassword) return setErrorMessage('관리자 비밀번호를 입력하세요.');
    setGuestBusy(true);
    setErrorMessage('');
    try {
      await guestLogin(guestPassword);
      router.push('/');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setGuestBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F5F5F7'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        width: 'min(400px, 92vw)'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          스쿨메이트 AI
        </h1>
        <p style={{ color: '#6E6E73', marginBottom: '32px', fontSize: '14px' }}>
          교사 업무 자동화 플랫폼
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#0066CC',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0071E3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#0066CC'}
        >
          Google로 로그인
        </button>

        <button
          onClick={() => setGuideOpen(true)}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px 16px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <Icon name="menu_book" size={18} style={{ marginRight: 6 }} /> 사용방법 안내
        </button>

        <button
          onClick={() => { setGuestOpen(!guestOpen); setErrorMessage(''); }}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '10px 16px',
            backgroundColor: '#E5E7EB',
            color: '#111827',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <Icon name="key" size={17} style={{ marginRight: 6 }} /> 테스트 사용자 입장 (관리자 비밀번호)
        </button>

        {guestOpen && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <input
              type="password"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGuestLogin(); }}
              placeholder="관리자 비밀번호"
              style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <button
              onClick={handleGuestLogin}
              disabled={guestBusy}
              style={{
                padding: '10px 16px',
                backgroundColor: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: guestBusy ? 0.6 : 1,
              }}
            >
              {guestBusy ? '확인 중...' : '입장'}
            </button>
          </div>
        )}

        {errorMessage ? (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#B91C1C' }}>
            {errorMessage}
          </p>
        ) : null}

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#6E6E73' }}>
          Google 계정으로 안전하게 로그인하세요. 심사·체험용 테스트 입장은 관리자에게 비밀번호를 문의하세요.
        </p>
      </div>

      {guideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사용방법 안내"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
          onClick={() => setGuideOpen(false)}
        >
          <div
            style={{ width: 'min(720px, 94vw)', maxHeight: '86vh', background: 'white', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E0E0E0' }}>
              <strong>사용방법 안내</strong>
              <button className="btn-primary" onClick={() => setGuideOpen(false)}>닫기</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 20px' }}>
              <UserGuide />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '100px' }}>로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
