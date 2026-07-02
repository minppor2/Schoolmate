"use client";
import { useEffect, useState } from 'react';
import { buildScheduleDraftFromText } from '@/lib/analyzer';
import { gcalUrl } from '@/lib/scheduleUtils';
import Icon from '@/components/Icon';

export default function Schedule() {
  const [schedules, setSchedules] = useState([
    { id: 1, title: '학년부 회의', date: '오늘', time: '10:30' },
    { id: 2, title: '체험학습 답사', date: '7월 3일', time: '14:00' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartISO, setNewStartISO] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [draft, setDraft] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const persistSchedules = (next) => {
    try { localStorage.setItem('schedules', JSON.stringify(next.filter(s => s.id !== 1 && s.id !== 2))); } catch (e) {}
  };

  function handleImport(tasks) {
    setSchedules(prev => {
      const existingTitles = new Set(prev.map(s => s.title));
      const added = tasks.filter(t => !existingTitles.has(t.title)).map(t => ({
        id: Date.now() + Math.random(),
        title: t.title,
        date: t.date || '미정',
        time: t.time || '미정',
        startISO: t.startISO || null,
      }));
      const next = [...prev, ...added];
      persistSchedules(next);
      return next;
    });
    setImportOpen(false);
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('schedules') || '[]');
      if (Array.isArray(saved) && saved.length) {
        setSchedules((prev) => [...prev, ...saved]);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAdd = () => {
    if (!newTitle || !newDate) return;
    const timeLabel = newStartISO
      ? `${String(new Date(newStartISO).getHours()).padStart(2, '0')}:${String(new Date(newStartISO).getMinutes()).padStart(2, '0')}`
      : '미정';
    setSchedules((prev) => {
      const next = [...prev, { id: Date.now(), title: newTitle, date: newDate, time: timeLabel, startISO: newStartISO }];
      try { localStorage.setItem('schedules', JSON.stringify(next.filter(s => s.id !== 1 && s.id !== 2))); } catch (e) {}
      return next;
    });
    setNewTitle('');
    setNewDate('');
    setNewStartISO(null);
    setIsModalOpen(false);
  };

  const handleAnalyzeMessage = async () => {
    if (!messageText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = buildScheduleDraftFromText(messageText, { defaultHour: 9 });
      setDraft(result);
      if (result.isTask && result.schedule) {
        setNewTitle(result.schedule.title);
        // 날짜 칸에는 날짜만 넣는다 (시간은 startISO에서 별도 표시)
        if (result.schedule.startISO) {
          const d = new Date(result.schedule.startISO);
          const p = (n) => String(n).padStart(2, '0');
          setNewDate(`${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`);
        } else {
          setNewDate(result.schedule.date);
        }
        setNewStartISO(result.schedule.startISO || null);
        setIsModalOpen(true);
      }
    } catch (err) {
      alert('분석 실패: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-display">일정</h2>
          <p className="text-caption" style={{ marginTop: '4px' }}>메시지를 분석해 일정으로 바로 저장합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setImportOpen(true)}><Icon name="inbox" size={16} style={{ marginRight: 4 }} />업무함에서 불러오기</button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>새 일정</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 className="text-title">메시지로 일정 생성</h3>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="예: 내일 오후 3시 상담해주세요"
          style={{ minHeight: '90px', padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-caption">메시지를 입력하면 AI가 일정 후보로 자동 분석합니다.</span>
          <button className="btn-primary" onClick={handleAnalyzeMessage} disabled={isAnalyzing}>
            {isAnalyzing ? '분석 중...' : '분석하기'}
          </button>
        </div>
        {draft && (
          <div className="text-caption" style={{ color: draft.isTask ? 'var(--color-primary)' : 'var(--color-status-orange)' }}>
            {draft.isTask ? `일정 후보로 인식됨: ${draft.schedule?.title || draft.title}` : '일정으로 인식되지 않았습니다.'}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schedules.map(sch => (
          <div key={sch.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
            <div>
              <h4 className="text-body-strong">{sch.title}</h4>
              <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="event" size={15} /> {sch.date} <Icon name="schedule" size={15} style={{ marginLeft: 6 }} /> {sch.time}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={gcalUrl(sch)} target="_blank" rel="noreferrer noopener">
                <button className="btn-secondary"><Icon name="calendar_add_on" size={16} style={{ marginRight: 4 }} />Google 캘린더에 추가</button>
              </a>
              <button className="btn-utility" onClick={() => setSchedules(schedules.filter(s => s.id !== sch.id))}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {importOpen && <ImportModal onImport={handleImport} onClose={() => setImportOpen(false)} />}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '400px', background: 'var(--color-canvas)', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 className="text-title" style={{ marginBottom: '20px' }}>새 일정 등록</h3>
            <input 
              type="text" 
              placeholder="일정 제목" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}
            />
            <input 
              type="text" 
              placeholder="날짜 (예: 7월 5일)" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '24px', border: '1px solid var(--color-hairline)', borderRadius: '8px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
              <button className="btn-primary" onClick={handleAdd}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 업무함에 저장된 업무를 골라 일정으로 가져오는 모달
function ImportModal({ onImport, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('inbox_tasks') || '[]');
      const saved = all.filter(t => t.status === 'saved' && !t.done);
      setTasks(saved);
      const init = {};
      saved.forEach(t => { init[t.id] = true; });
      setChecked(init);
    } catch (e) {}
  }, []);

  const selected = tasks.filter(t => checked[t.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(480px, 92vw)', maxHeight: '80vh', overflowY: 'auto', background: 'var(--color-canvas)', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-title" style={{ marginBottom: '8px' }}>업무함에서 불러오기</h3>
        <p className="text-caption" style={{ marginTop: 0 }}>저장한 업무(미완료)를 일정으로 가져옵니다.</p>
        {tasks.length === 0 ? (
          <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-muted-ink)' }}>가져올 업무가 없습니다. 업무함에서 업무를 저장해보세요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '12px 0' }}>
            {tasks.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', background: checked[t.id] ? 'var(--color-parchment)' : 'transparent' }}>
                <input type="checkbox" checked={!!checked[t.id]} onChange={(e) => setChecked(prev => ({ ...prev, [t.id]: e.target.checked }))} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                  <span className="text-fine">{t.date || '날짜 미정'}{t.time ? ` · ${t.time}` : ''}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" disabled={selected.length === 0} onClick={() => onImport(selected)}>
            {selected.length}건 가져오기
          </button>
        </div>
      </div>
    </div>
  );
}
