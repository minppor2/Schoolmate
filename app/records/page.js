"use client";
import { useState } from 'react';
import LinkPortal from '../components/LinkPortal';
import SetukChecker from '../components/SetukChecker';
import { LIMITS, RULES } from '@/lib/setukRules';

const TABS = [
  { id: 'portal', label: '내 자료실' },
  { id: 'setuk', label: '세특 점검' },
  { id: 'guides', label: '지침 요약' },
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

      {tab === 'setuk' && <SetukChecker />}

      {tab === 'guides' && <GuideSummary />}
    </div>
  );
}

// 「2026 학교생활기록부 기재 길라잡이(중학교)」 핵심 요약
function GuideSummary() {
  const errors = RULES.filter(r => r.severity === 'error');
  const warns = RULES.filter(r => r.severity === 'warn');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <h3 className="text-title" style={{ marginTop: 0 }}>입력 가능 최대 글자수 (한글 기준)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <tbody>
            {LIMITS.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                <td style={{ padding: '10px 4px' }}>{l.label}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700 }}>{l.max}자</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="text-title" style={{ marginTop: 0, color: '#B91C1C' }}>모든 항목 기재 불가 (주요)</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 2 }}>
          {errors.map(r => <li key={r.id}><b>{r.category}</b> — {r.desc}</li>)}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-title" style={{ marginTop: 0, color: '#B45309' }}>문맥 확인 필요</h3>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 2 }}>
          {warns.map(r => <li key={r.id}><b>{r.category}</b> — {r.desc}</li>)}
        </ul>
      </div>

      <div className="card" style={{ fontSize: 13.5, lineHeight: 1.8 }}>
        <h3 className="text-title" style={{ marginTop: 0 }}>원문 및 공식 자료</h3>
        <p style={{ margin: 0 }}>
          본 요약은 「2026학년도 학교생활기록부 기재 길라잡이(중학교)」(교육부)를 바탕으로 하며,
          정확한 지침은 원문을 확인하세요. 원문·점검표(한글/PDF)는{' '}
          <a href="https://star.moe.go.kr" target="_blank" rel="noreferrer noopener" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            학교생활기록부 종합지원포털(star.moe.go.kr)
          </a>{' '}
          → 자료실 → 교원 자료실에서 내려받을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
