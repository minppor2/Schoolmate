'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

const GUEST_KEY = 'guest_mode';
const GUEST_USER = {
  uid: 'guest',
  displayName: '테스트 사용자',
  email: '테스트 계정 (관리자 입장)',
  isGuest: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 현재 로그인 상태 확인 (Firebase 사용자가 없으면 게스트 모드 확인)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        let isGuest = false;
        try { isGuest = sessionStorage.getItem(GUEST_KEY) === '1'; } catch (e) {}
        setUser(isGuest ? GUEST_USER : null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const googleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('로그인 실패:', error);
      setError(error.message);
      throw error;
    }
  };

  // 테스트 사용자 입장: 관리자 비밀번호를 서버에서 확인한 뒤 게스트 세션 시작
  const guestLogin = async (password) => {
    setError(null);
    const res = await fetch('/api/guest-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '입장에 실패했습니다.');
    }
    try { sessionStorage.setItem(GUEST_KEY, '1'); } catch (e) {}
    setUser(GUEST_USER);
    return GUEST_USER;
  };

  const logout = async () => {
    try {
      setError(null);
      try { sessionStorage.removeItem(GUEST_KEY); } catch (e) {}
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setError(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, googleLogin, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서만 사용 가능합니다');
  }
  return context;
}
