'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div style={{ textAlign: 'center', paddingTop: '100px' }}>로딩 중...</div>;
  }

  const userName = user?.displayName?.split(' ')[0] || '선생님';

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        {userName}님, 안녕하세요!
      </h1>
      <p style={{ fontSize: '16px', color: '#666' }}>
        로그인이 성공적으로 완료되었습니다.
      </p>
      <p style={{ fontSize: '14px', color: '#999', marginTop: '16px' }}>
        이메일: {user.email}
      </p>
    </div>
  );
}
