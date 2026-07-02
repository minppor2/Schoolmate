"use client";
import { useState } from 'react';
import LinkPortal from '../components/LinkPortal';

const TABS = [
  { id: 'portal', label: '내 자료실' },
  { id: 'setuk', label: '세특 점검' },
  { id: 'guides', label: '지침 파일' },
];

const DEFAULT_LINKS = [
  {
    id: 'classplay',
    title: 'CLASS PLAY HUB',
    desc: '수업 도구 모음 허브',
    url: '/CLASS_PLAY_HUB_v1.3.html',
    icon: '📚',
  },
];

export default function Records() {
  const [tab, setTab] = useState('portal');

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-display">학생기록 도우미</h2>
        <p className="text-caption" style={{ marginTop: '4px' }}>세특 점검 및 자료 보관소입니다.</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-hairline)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              paddingBottom: '12px',
              background: 'none',
              borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-muted-ink)',
              fontWeight: tab === t.id ? '600' : '400',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'portal' && (
        <LinkPortal storageKey="records_portal_links" defaultLinks={DEFAULT_LINKS} />
      )}

      {tab === 'setuk' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted-ink)' }}>
          <p>세특 점검 기능은 준비 중입니다.</p>
        </div>
      )}

      {tab === 'guides' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted-ink)' }}>
          <p>저장된 지침 파일이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
