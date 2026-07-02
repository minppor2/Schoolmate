"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { buildScheduleDraftFromText } from '@/lib/analyzer';
import { gcalUrl, ddayInfo, resolveStart } from '@/lib/scheduleUtils';
import Icon from '@/components/Icon';

const STORAGE_KEY = 'inbox_tasks';

const DEFAULT_TASKS = [
  { id: 1, title: '체험학습 CMS 출금 안내', source: '직접 입력', date: '', time: '', startISO: null, importance: 'important', status: 'candidate', done: false },
  { id: 2, title: '정보보안 교육 이수', source: '직접 입력', date: '7월 5일', time: '', startISO: null, importance: 'normal', status: 'candidate', done: false },
];

const TABS = [
  { id: 'candidate', label: '업무 후보' },
  { id: 'saved', label: '저장한 업무' },
  { id: 'ignored', label: '무시한 메시지' },
];

function isoToLabels(due, time) {
  if (!due) return { date: '', time: time || '', startISO: null };
  const d = new Date(`${due}T${time || '09:00'}:00`);
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`,
    time: time || '',
    startISO: isNaN(d) ? null : d.toISOString(),
  };
}

export default function Inbox() {
  const { user } = useAuth();
  const router = useRouter();
  const cloud = !!user && !user.isGuest;

  // 업무 마감 날짜의 특별실 예약 화면으로 이동
  function goReserve(task) {
    const start = resolveStart(task);
    const p = (n) => String(n).padStart(2, '0');
    const dateStr = start ? `${start.getFullYear()}-${p(start.getMonth() + 1)}-${p(start.getDate())}` : '';
    router.push(dateStr ? `/reservation?date=${dateStr}` : '/reservation');
  }

  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [loaded, setLoaded] = useState(false);
  const [synced, setSynced] = useState(false);
  const [tab, setTab] = useState('candidate');
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState('');
  const [dateModal, setDateModal] = useState(null); // 저장 시 날짜 확인이 필요한 task

  // ---------- 불러오기 (localStorage → Firestore 구독) ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setTasks(parsed);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!cloud) { setSynced(false); return; }
    try {
      return onSnapshot(doc(db, 'users', user.uid, 'appdata', 'inbox'), (snap) => {
        setSynced(true);
        const data = snap.data();
        if (data && Array.isArray(data.tasks) && data.tasks.length) setTasks(data.tasks);
      }, (err) => { console.error('inbox sync failed', err); setSynced(false); });
    } catch (e) { console.error(e); setSynced(false); }
  }, [cloud, user]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) {}
  }, [tasks, loaded]);

  function applyChange(updater) {
    setTasks(prev => {
      const next = updater(prev);
      if (cloud) {
        setDoc(doc(db, 'users', user.uid, 'appdata', 'inbox'), { tasks: next, updatedAt: new Date().toISOString() })
          .catch(e => console.error('Failed to save inbox', e));
      }
      return next;
    });
  }

  // ---------- 메시지 분석 → 업무 후보 추가 ----------
  async function handleAnalyze() {
    const msg = text.trim();
    if (!msg || analyzing) return;
    setAnalyzing(true);
    setNotice('');
    let added = 0;
    try {
      // 1차: Gemini 추출 (여러 업무 지원)
      const res = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.tasks) && data.tasks.length) {
        const newTasks = data.tasks.map((t, i) => ({
          id: Date.now() + i,
          title: t.title,
          source: 'AI 분석',
          ...isoToLabels(t.due, t.time),
          importance: t.importance,
          status: 'candidate',
          done: false,
        }));
        applyChange(prev => [...newTasks, ...prev]);
        added = newTasks.length;
      } else if (!res.ok) {
        throw new Error(data.error || 'AI 분석 실패');
      }
    } catch (err) {
      // 2차: 규칙 기반 분석기로 대체
      try {
        const draft = buildScheduleDraftFromText(msg, { defaultHour: 9 });
        if (draft.isTask) {
          const s = draft.schedule || {};
          const d = s.startISO ? new Date(s.startISO) : null;
          const p = (n) => String(n).padStart(2, '0');
          applyChange(prev => [{
            id: Date.now(),
            title: (draft.title || msg).slice(0, 60),
            source: '빠른 분석',
            date: d ? `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}` : '',
            time: d ? `${p(d.getHours())}:${p(d.getMinutes())}` : '',
            startISO: s.startISO || null,
            importance: 'normal',
            status: 'candidate',
            done: false,
          }, ...prev]);
          added = 1;
          setNotice('AI 분석이 불가해 빠른 분석으로 추가했습니다. (' + err.message + ')');
        }
      } catch (e2) {}
      if (!added) setNotice('업무로 인식된 내용이 없습니다. (' + err.message + ')');
    } finally {
      if (added) {
        setText('');
        setTab('candidate');
        if (!notice) setNotice(`업무 후보 ${added}건을 추가했습니다.`);
      } else if (!notice) {
        setNotice('업무로 인식된 내용이 없습니다.');
      }
      setAnalyzing(false);
    }
  }

  // ---------- 상태 변경 ----------
  const setStatus = (id, status) => applyChange(prev => prev.map(t => t.id === id ? { ...t, status } : t));

  function handleSaveClick(task) {
    if (!task.date) { setDateModal(task); return; }
    setStatus(task.id, 'saved');
  }

  function saveWithDate(task, due, time) {
    const labels = due ? isoToLabels(due, time) : { date: '', time: '', startISO: null };
    applyChange(prev => prev.map(t => t.id === task.id ? { ...t, ...labels, status: 'saved' } : t));
    setDateModal(null);
  }

  const toggleDone = (id) => applyChange(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => { if (confirm('삭제하시겠습니까?')) applyChange(prev => prev.filter(t => t.id !== id)); };

  function addToSchedule(task) {
    try {
      const saved = JSON.parse(localStorage.getItem('schedules') || '[]');
      saved.push({ id: Date.now(), title: task.title, date: task.date || '미정', time: task.time || '미정', startISO: task.startISO || null });
      localStorage.setItem('schedules', JSON.stringify(saved));
      setNotice(`"${task.title}" 일정 페이지에 추가했습니다.`);
    } catch (e) { alert('일정 추가에 실패했습니다.'); }
  }

  const list = tasks.filter(t => t.status === tab);
  const count = (id) => tasks.filter(t => t.status === id).length;

  const Dday = ({ task }) => {
    const info = ddayInfo(task);
    if (!info) return <span className="badge" style={{ background: 'var(--color-parchment)', color: 'var(--color-status-orange)' }}>날짜 미정</span>;
    return (
      <span className="badge" style={{
        background: info.overdue ? '#FEE2E2' : info.today ? '#FEF3C7' : '#DBEAFE',
        color: info.overdue ? '#B91C1C' : info.today ? '#B45309' : '#1D4ED8',
        fontWeight: 700,
      }}>{info.label}</span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="text-display" style={{ margin: 0 }}>업무함</h2>
        <p className="text-caption" style={{ marginTop: '6px' }}>
          메시지를 분석해 업무로 정리합니다.
          {cloud ? (synced ? ' · ☁ 클라우드 동기화 중' : ' · ☁ 연결 중...') : ' · 이 브라우저에만 저장됩니다'}
        </p>
      </div>

      {/* ---------- 메시지 분석 입력 ---------- */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 className="text-title">메시지로 업무 추가</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'받은 메시지나 공문 내용을 붙여넣으세요.\n예: 7월 10일까지 생활기록부 마감입니다. 그리고 내일 오후 2시 학년회의 참석해주세요.'}
          style={{ minHeight: '100px', padding: '12px', border: '1px solid var(--color-hairline)', borderRadius: '8px', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="text-caption">AI가 여러 업무도 한 번에 추출합니다 (마감일·중요도 포함).</span>
          <button className="btn-primary" onClick={handleAnalyze} disabled={analyzing || !text.trim()}>
            {analyzing ? 'AI 분석 중...' : <><Icon name="smart_toy" size={17} style={{ marginRight: 6 }} />분석해서 추가</>}
          </button>
        </div>
        {notice && <div className="text-caption" style={{ color: 'var(--color-primary)' }}>{notice}</div>}
      </div>

      {/* ---------- 탭 ---------- */}
      <div style={{ borderBottom: '1px solid var(--color-hairline)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              paddingBottom: '12px',
              borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-muted-ink)',
              fontWeight: tab === t.id ? '600' : '400',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label} ({count(t.id)})
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted-ink)' }}>
          {tab === 'candidate' ? '업무 후보가 없습니다. 위에 메시지를 붙여넣고 분석해보세요.' : tab === 'saved' ? '저장한 업무가 없습니다.' : '무시한 메시지가 없습니다.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {list.map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: tab === 'ignored' ? 0.65 : task.done ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-fine" style={{ background: 'var(--color-parchment)', padding: '4px 8px', borderRadius: '8px' }}>{task.source}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                {task.importance === 'important' && <span className="badge badge-orange">중요</span>}
                <Dday task={task} />
              </span>
            </div>

            <h4 className="text-body-strong" style={{ textDecoration: (tab === 'ignored' || task.done) ? 'line-through' : 'none' }}>
              {task.title}
            </h4>
            <div className="text-caption" style={{ color: 'var(--color-muted-ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="event" size={15} /> {task.date || '날짜 미정'}
              {task.time ? <><Icon name="schedule" size={15} style={{ marginLeft: 6 }} /> {task.time}</> : null}
            </div>

            {tab === 'candidate' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSaveClick(task)}>저장</button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStatus(task.id, 'ignored')}>무시</button>
              </div>
            )}

            {tab === 'saved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto', paddingTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={!!task.done} onChange={() => toggleDone(task.id)} />
                  완료
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a href={gcalUrl(task)} target="_blank" rel="noreferrer noopener" style={{ flex: 1 }}>
                    <button className="btn-secondary" style={{ width: '100%' }}><Icon name="calendar_add_on" size={16} style={{ marginRight: 4 }} />캘린더</button>
                  </a>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => addToSchedule(task)}>일정에 추가</button>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => goReserve(task)}><Icon name="school" size={16} style={{ marginRight: 4 }} />특별실 예약</button>
                  <button className="btn-utility" onClick={() => remove(task.id)}>삭제</button>
                </div>
              </div>
            )}

            {tab === 'ignored' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStatus(task.id, 'candidate')}><Icon name="undo" size={16} style={{ marginRight: 4 }} />복구</button>
                <button className="btn-utility" onClick={() => remove(task.id)}>삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {dateModal && (
        <DateModal
          task={dateModal}
          onSave={(due, time) => saveWithDate(dateModal, due, time)}
          onClose={() => setDateModal(null)}
        />
      )}
    </div>
  );
}

// 날짜 미정 업무를 저장할 때 마감일을 확인하는 모달
function DateModal({ task, onSave, onClose }) {
  const [due, setDue] = useState('');
  const [time, setTime] = useState('');
  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)', fontFamily: 'inherit' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ width: 'min(420px, 92vw)', background: 'white', borderRadius: 10, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>마감일 확인</h3>
        <p className="text-caption" style={{ marginTop: 0 }}>"{task.title}" — 날짜가 확인되지 않았습니다. 마감일을 알면 입력해주세요.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <input type="date" style={{ ...inputStyle, flex: 1 }} value={due} onChange={(e) => setDue(e.target.value)} />
          <input type="time" style={inputStyle} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-secondary" onClick={() => onSave(null, null)}>날짜 없이 저장</button>
          <button className="btn-primary" onClick={() => { if (!due) return alert('날짜를 선택하거나 "날짜 없이 저장"을 누르세요.'); onSave(due, time); }}>저장</button>
        </div>
      </div>
    </div>
  );
}
