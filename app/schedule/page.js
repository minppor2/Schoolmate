"use client";
import { useEffect, useState } from 'react';
import { buildScheduleDraftFromText } from '@/lib/analyzer';

// Google 캘린더 일정 등록 URL (로그인 연동 없이 작동하는 템플릿 방식)
function toGCalStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

// 앱이 표시하는 날짜 문자열("오늘", "7월 3일", "2026-07-03" 등)을 Date로 변환
function parseDisplayDate(dateStr) {
  const text = String(dateStr || '');
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (text.includes('오늘')) return base;
  if (text.includes('내일')) { base.setDate(base.getDate() + 1); return base; }
  if (text.includes('모레')) { base.setDate(base.getDate() + 2); return base; }
  const md = text.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (md) return new Date(md[1] ? +md[1] : now.getFullYear(), +md[2] - 1, +md[3]);
  const parsed = new Date(text);
  if (!isNaN(parsed)) return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return null;
}

function gcalUrl(sch) {
  const params = new URLSearchParams({ action: 'TEMPLATE', text: sch.title, details: '스쿨메이트 AI에서 추가한 일정' });
  let start = sch.startISO ? new Date(sch.startISO) : null;
  if (!start || isNaN(start)) {
    start = parseDisplayDate(sch.date);
    if (start) {
      const tm = /^(\d{1,2}):(\d{2})$/.exec(sch.time || '');
      start.setHours(tm ? +tm[1] : 9, tm ? +tm[2] : 0, 0, 0);
    }
  }
  if (start && !isNaN(start)) {
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    params.set('dates', `${toGCalStamp(start)}/${toGCalStamp(end)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

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
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>새 일정</button>
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
              <span className="text-caption">📅 {sch.date} ⏰ {sch.time}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={gcalUrl(sch)} target="_blank" rel="noreferrer noopener">
                <button className="btn-secondary">📅 Google 캘린더에 추가</button>
              </a>
              <button className="btn-utility" onClick={() => setSchedules(schedules.filter(s => s.id !== sch.id))}>삭제</button>
            </div>
          </div>
        ))}
      </div>

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
