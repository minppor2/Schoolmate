'use client';

import { useEffect, useState } from 'react';

const DOCS = {
  terms: { title: '이용약관', src: '/legal/terms.pdf' },
  privacy: { title: '개인정보처리방침', src: '/legal/privacy.pdf' },
};

export default function Footer() {
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e) => { if (e.key === 'Escape') setDoc(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [doc]);

  const linkStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'var(--color-muted-ink)',
    fontSize: 12,
    textDecoration: 'underline',
    fontFamily: 'inherit',
  };

  return (
    <footer style={{ marginTop: 48, padding: '20px 0 8px', borderTop: '1px solid var(--color-hairline)' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" style={{ ...linkStyle, fontWeight: 600 }} onClick={() => setDoc(DOCS.terms)}>이용약관</button>
        <button type="button" style={{ ...linkStyle, fontWeight: 600 }} onClick={() => setDoc(DOCS.privacy)}>개인정보처리방침</button>
        <span className="text-fine">정보관리책임자: 이x영 (창일중학교) · ☎ 02-994-5934 · 📱 010-9xxx-xxxx</span>
      </div>
      <p className="text-fine" style={{ textAlign: 'center', marginTop: 8 }}>
        © 2026 스쿨메이트 AI. All rights reserved.
      </p>

      {doc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={doc.title}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
          onClick={() => setDoc(null)}
        >
          <div
            style={{ width: 'min(860px, 94vw)', height: '86vh', background: 'white', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--color-hairline)' }}>
              <strong>{doc.title}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={doc.src} target="_blank" rel="noreferrer noopener">
                  <button className="btn-secondary">새 창</button>
                </a>
                <button className="btn-primary" onClick={() => setDoc(null)}>닫기</button>
              </div>
            </div>
            <iframe src={doc.src} title={doc.title} style={{ flex: 1, width: '100%', border: 0 }} />
          </div>
        </div>
      )}
    </footer>
  );
}
