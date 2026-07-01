'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPE = 'openid email profile https://www.googleapis.com/auth/chat.messages.readonly https://www.googleapis.com/auth/calendar.events';

function LoginContent() {
  const { user, loading, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');

  useEffect(() => {
    const callbackToken = searchParams.get('token');
    if (callbackToken) {
      localStorage.setItem('google_access_token', callbackToken);
      setToken(callbackToken);
      router.push('/inbox');
      return;
    }

    // 이미 로그인되어 있으면 홈으로 리다이렉트
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router, searchParams]);

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: GOOGLE_SCOPE,
        access_type: 'offline',
        prompt: 'consent',
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (error) {
      alert('로그인 실패: ' + error.message);
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
        maxWidth: '400px'
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

        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Google Chat access token을 붙여넣으세요"
          style={{ width: '100%', minHeight: '80px', marginTop: '16px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#6E6E73' }}>
          Google 계정으로 안전하게 로그인하고, 토큰이 있으면 Google Chat 연동 테스트도 가능합니다.
        </p>
      </div>
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
