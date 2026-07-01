"use client";
import { useState } from 'react';

export default function Inbox() {
  const [activeTab, setActiveTab] = useState(0);
  const [candidates, setCandidates] = useState([
    { id: 1, title: '체험학습 CMS 출금 안내', source: '1학년부 업무방', date: '확인 필요', importance: 'important' },
    { id: 2, title: '정보보안 교육 이수', source: '교무부 공지', date: '7월 5일', importance: 'normal' }
  ]);
  const [saved, setSaved] = useState([
    { id: 3, title: '학부모 상담록 나이스 입력', source: '직접 입력', date: '오늘 중' }
  ]);
  const [ignored, setIgnored] = useState([]);

  const handleSave = (task) => {
    setSaved([...saved, { ...task, date: task.date === '확인 필요' ? '미정' : task.date }]);
    setCandidates(candidates.filter(c => c.id !== task.id));
  };

  const handleIgnore = (task) => {
    setIgnored([...ignored, task]);
    setCandidates(candidates.filter(c => c.id !== task.id));
  };

  const tabs = ['업무 후보', '저장한 업무', '무시한 메시지'];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-display">업무함</h2>
        <p className="text-caption" style={{ marginTop: '4px' }}>Google Chat에서 수집된 업무 메시지입니다.</p>
      </div>
      
      <div style={{ borderBottom: '1px solid var(--color-hairline)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        {tabs.map((tab, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveTab(idx)}
            style={{ 
              paddingBottom: '12px', 
              borderBottom: activeTab === idx ? '2px solid var(--color-primary)' : '2px solid transparent', 
              color: activeTab === idx ? 'var(--color-primary)' : 'var(--color-muted-ink)', 
              fontWeight: activeTab === idx ? '600' : '400', 
              background: 'none' 
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {activeTab === 0 && candidates.length === 0 && <p style={{ color: 'var(--color-muted-ink)' }}>대기 중인 업무 후보가 없습니다.</p>}
        {activeTab === 0 && candidates.map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-fine" style={{ background: 'var(--color-parchment)', padding: '4px 8px', borderRadius: '8px' }}>{task.source}</span>
              {task.importance === 'important' && <span className="badge badge-orange">중요</span>}
            </div>
            <h4 className="text-body-strong">{task.title}</h4>
            <div className="text-caption" style={{ color: task.date === '확인 필요' ? 'var(--color-status-orange)' : 'var(--color-muted-ink)' }}>
              📅 {task.date}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSave(task)}>저장</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => handleIgnore(task)}>무시</button>
            </div>
          </div>
        ))}

        {activeTab === 1 && saved.length === 0 && <p style={{ color: 'var(--color-muted-ink)' }}>저장한 업무가 없습니다.</p>}
        {activeTab === 1 && saved.map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 className="text-body-strong">{task.title}</h4>
            <div className="text-caption" style={{ color: 'var(--color-muted-ink)' }}>📅 {task.date}</div>
            <div className="text-fine" style={{ color: 'var(--color-primary)' }}>✓ 저장됨</div>
          </div>
        ))}

        {activeTab === 2 && ignored.length === 0 && <p style={{ color: 'var(--color-muted-ink)' }}>무시한 메시지가 없습니다.</p>}
        {activeTab === 2 && ignored.map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.6 }}>
            <h4 className="text-body-strong" style={{ textDecoration: 'line-through' }}>{task.title}</h4>
            <div className="text-caption">📅 {task.date}</div>
            <div className="text-fine">무시됨</div>
          </div>
        ))}
      </div>
    </div>
  );
}
