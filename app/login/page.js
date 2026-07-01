'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { user, loading, googleLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 이미 로그인되어 있으면 홈으로 리다이렉트
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      router.push('/');
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

        <p style={{ marginTop: '20px', fontSize: '12px', color: '#6E6E73' }}>
          Google 계정으로 안전하게 로그인합니다
        </p>
      </div>
    </div>
  );
}
