'use client';

import { useEffect, useState } from 'react';
import { PrivacyPolicy, TermsOfService, UserGuide, SERVICE_NAME, MANAGER, GITHUB_URL } from './LegalDocs';

const DOCS = {
  terms: { title: '이용약관', Body: TermsOfService },
  privacy: { title: '개인정보처리방침', Body: PrivacyPolicy },
  guide: { title: '사용방법 안내', Body: UserGuide },
};

export default function Footer() {
  const [docKey, setDocKey] = useState(null);
  const doc = docKey ? DOCS[docKey] : null;

  useEffect(() => {
    if (!doc) return;
    const onKey = (e) => { if (e.key === 'Escape') setDocKey(null); };
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
    fontWeight: 600,
    textDecoration: 'underline',
    fontFamily: 'inherit',
  };

  return (
    <footer style={{ marginTop: 48, padding: '20px 0 8px', borderTop: '1px solid var(--color-hairline)' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <button type="button" style={linkStyle} onClick={() => setDocKey('terms')}>이용약관</button>
        <button type="button" style={linkStyle} onClick={() => setDocKey('privacy')}>개인정보처리방침</button>
        <button type="button" style={linkStyle} onClick={() => setDocKey('guide')}>사용방법 안내</button>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" style={linkStyle}>GitHub 소스코드</a>
      </div>
      <p className="text-fine" style={{ textAlign: 'center', marginTop: 10 }}>
        개인정보책임자: {MANAGER.name} {MANAGER.title} ({MANAGER.school}) | 문의: {MANAGER.phone}
      </p>
      <p className="text-fine" style={{ textAlign: 'center', marginTop: 4 }}>
        © 2026 {SERVICE_NAME}. All rights reserved.
      </p>

      {doc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={doc.title}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
          onClick={() => setDocKey(null)}
        >
          <div
            style={{ width: 'min(720px, 94vw)', maxHeight: '86vh', background: 'white', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-hairline)' }}>
              <strong>{doc.title}</strong>
              <button className="btn-primary" onClick={() => setDocKey(null)}>닫기</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 20px' }}>
              <doc.Body />
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
