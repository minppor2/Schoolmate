'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPE = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    const callbackToken = searchParams.get('token');
    const callbackError = searchParams.get('error');

    if (callbackError) {
      setErrorMessage(callbackError);
    }

    if (callbackToken) {
      localStorage.setItem('google_access_token', callbackToken);
      setToken(callbackToken);
      router.push('/inbox');
      return;
    }

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

  const verifyToken = async () => {
    if (!token) {
      return alert('토큰을 먼저 입력하거나 붙여넣으세요.');
    }

    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      setTokenInfo(data);
      if (!res.ok) {
        setErrorMessage(data.error_description || data.error || '토큰 검증에 실패했습니다.');
      } else {
        setErrorMessage('토큰이 유효합니다. scopes: ' + (data.scope || '없음'));
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

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
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (!token) return alert('토큰을 입력하거나 붙여넣으세요.');
              localStorage.setItem('google_access_token', token);
              router.push('/inbox');
            }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#0066CC',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            토큰 저장
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('google_access_token');
              setToken('');
              setErrorMessage('');
              setTokenInfo(null);
              alert('저장된 토큰을 삭제했습니다.');
            }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#E5E7EB',
              color: '#111827',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            토큰 삭제
          </button>
          <button
            type="button"
            onClick={verifyToken}
            style={{
              padding: '10px 14px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            토큰 검증
          </button>
        </div>
        {errorMessage ? (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#B91C1C' }}>
            {errorMessage}
          </p>
        ) : null}
        {tokenInfo ? (
          <pre style={{ marginTop: '10px', fontSize: '12px', color: '#111827', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        ) : null}
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
