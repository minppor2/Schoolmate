'use client';

import { useEffect, useRef, useState } from 'react';

const WELCOME = {
  role: 'assistant',
  content: '안녕하세요! 스쿨메이트 AI 챗봇입니다 🤖\n사이트 사용법이나 교사 업무에 대해 무엇이든 물어보세요.',
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter(m => m !== WELCOME) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '응답을 받지 못했습니다.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || '(빈 응답)' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + err.message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* 플로팅 버튼 (왼쪽 하단) */}
      <button
        type="button"
        aria-label={open ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          zIndex: 11000,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          fontSize: 26,
          background: '#0066CC',
          color: 'white',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI 챗봇"
          style={{
            position: 'fixed',
            left: 20,
            bottom: 88,
            zIndex: 11000,
            width: 'min(360px, calc(100vw - 40px))',
            height: 'min(500px, calc(100vh - 130px))',
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
            border: '1px solid #E0E0E0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', background: '#0066CC', color: 'white', fontWeight: 700, fontSize: 15 }}>
            🤖 스쿨메이트 AI 챗봇
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: '#F5F5F7' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '9px 13px',
                  borderRadius: 14,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: m.role === 'user' ? '#0066CC' : 'white',
                  color: m.role === 'user' ? 'white' : '#1D1D1F',
                  border: m.role === 'user' ? 'none' : '1px solid #E0E0E0',
                }}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div style={{ alignSelf: 'flex-start', padding: '9px 13px', borderRadius: 14, background: 'white', border: '1px solid #E0E0E0', fontSize: 13.5, color: '#6E6E73' }}>
                답변 작성 중...
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #E0E0E0', background: 'white' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(); }}
              placeholder="메시지를 입력하세요..."
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 14, fontFamily: 'inherit' }}
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || !input.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#0066CC',
                color: 'white',
                fontWeight: 700,
                cursor: busy || !input.trim() ? 'default' : 'pointer',
                opacity: busy || !input.trim() ? 0.5 : 1,
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}
