"use client";
import { useEffect, useState } from 'react';
import { normalizeGoogleChatMessages } from '@/lib/googleChat';

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
  const [connectionStatus, setConnectionStatus] = useState('대기 중');
  const [spacesList, setSpacesList] = useState([]);
  const [sendSpace, setSendSpace] = useState('spaces/AAA');
  const [sendText, setSendText] = useState('');
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalSpace, setModalSpace] = useState('spaces/AAA');
  const [modalText, setModalText] = useState('');
  const [modalSending, setModalSending] = useState(false);
  const [defaultHourSetting, setDefaultHourSetting] = useState(() => {
    try { return localStorage.getItem('default_meeting_hour') || '9'; } catch { return '9'; }
  });

  useEffect(() => {
    const loadChatData = async () => {
      try {
        const token = localStorage.getItem('google_access_token');
        if (!token) {
          setConnectionStatus('토큰이 없어 기본 샘플만 표시 중');
          return;
        }

        const response = await fetch('/api/google-chat', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Google Chat API 호출 실패: ${response.status} ${errorBody}`);
        }

        const data = await response.json();
        const normalized = normalizeGoogleChatMessages(data?.spaces || [], 'Google Chat');
        setCandidates((prev) => [...normalized, ...prev.filter((item) => item.source !== 'Google Chat')]);
        setConnectionStatus('Google Chat 연결됨');
      } catch (error) {
        console.error(error);
        setConnectionStatus('연결 실패: 토큰 또는 권한 확인 필요');
      }
    };

    loadChatData();
  }, []);

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
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <h2 className="text-display" style={{ margin: 0 }}>업무함</h2>
          <p className="text-caption" style={{ marginTop: '6px' }}>Google Chat에서 수집된 업무 메시지입니다.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <small style={{ color: 'var(--color-muted-ink)' }}>상태: {connectionStatus}</small>
          <button className="btn-secondary" onClick={async () => {
            try {
              const token = localStorage.getItem('google_access_token');
              if (!token) return alert('로그인 토큰이 필요합니다.');
              const res = await fetch('/api/google-chat', { headers: { Authorization: `Bearer ${token}` } });
              if (!res.ok) throw new Error('스페이스 조회 실패');
              const data = await res.json();
              // Google API returns spaces array under data.spaces or data.spaces
              const spaces = data?.spaces || data?.spaces || [];
              // normalize to objects with name and displayName
              const normalized = (spaces || []).map(s => ({ name: s.name, displayName: s.displayName || s.name }));
              setSpacesList(normalized);
              setConnectionStatus('스페이스 불러옴');
            } catch (err) {
              alert('스페이스 불러오기 실패: ' + err.message);
            }
          }}>스페이스 불러오기</button>
        </div>
      </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: 'var(--color-muted-ink)' }}>기본시간</label>
            <input value={defaultHourSetting} onChange={(e) => { setDefaultHourSetting(e.target.value); localStorage.setItem('default_meeting_hour', e.target.value); }} style={{ width: '48px' }} />시
            <div style={{ marginLeft: '8px' }}>
              <small style={{ color: 'var(--color-muted-ink)' }}>{spacesList.length ? `${spacesList.length}개 스페이스 불러옴` : '스페이스 없음'}</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
            <button className="btn-primary" onClick={() => { setModalSpace(sendSpace); setModalText(sendText); setShowModal(true); }}>메시지 보내기</button>
            <button className="btn-secondary" onClick={async () => {
              try {
                const textToAnalyze = sendText || (candidates[0] && candidates[0].title) || '';
                const res = await fetch('/api/analyzer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: textToAnalyze }),
                });
                const { result, error } = await res.json();
                if (error) throw new Error(error);
                if (result?.isTask && result.date) {
                  const confirmCreate = confirm(`일정으로 생성합니다:\n${result.title}\n일시: ${result.date}`);
                  if (confirmCreate) {
                    const token = localStorage.getItem('google_access_token');
                    if (token) {
                      try {
                        let startISO = result.date;
                        const d = new Date(startISO);
                        if (d.getHours() === 0 && d.getMinutes() === 0) {
                          const defaultHour = parseInt(localStorage.getItem('default_meeting_hour') || defaultHourSetting || '9', 10) || 9;
                          d.setHours(defaultHour, 0, 0, 0);
                          startISO = d.toISOString();
                        }
                        const endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
                        const res = await fetch('/api/calendar/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ accessToken: token, title: result.title, startISO, endISO, description: result.raw }),
                        });
                        const payload = await res.json();
                        if (!res.ok) throw new Error(payload.error || 'Calendar API error');
                        alert('Google Calendar에 일정이 생성되었습니다.');
                      } catch (err) {
                        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
                        schedules.push({ title: result.title, date: result.date, source: 'Google Chat (local fallback)' });
                        localStorage.setItem('schedules', JSON.stringify(schedules));
                        alert('Calendar 생성 실패, 로컬에 저장했습니다: ' + err.message);
                      }
                    } else {
                      const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
                      schedules.push({ title: result.title, date: result.date, source: 'Google Chat' });
                      localStorage.setItem('schedules', JSON.stringify(schedules));
                      alert('로그인 토큰이 없어 로컬에 일정 생성했습니다.');
                    }
                  }
                } else {
                  alert('일정으로 보이진 않습니다: ' + JSON.stringify(result));
                }
              } catch (err) {
                alert('분석 실패: ' + err.message);
              }
            }}>분석→일정생성</button>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-muted-ink)' }}>
            스페이스 ID 예: spaces/AAA, spaces/AAA/messages
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 'min(640px, 92%)', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
              <h3 style={{ marginTop: 0 }}>메시지 보내기</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={modalSpace} onChange={(e) => setModalSpace(e.target.value)} placeholder="스페이스 ID (예: spaces/AAA)" style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd' }} />
                <textarea value={modalText} onChange={(e) => setModalText(e.target.value)} placeholder="보낼 메시지" style={{ padding: '8px', minHeight: 120, borderRadius: 6, border: '1px solid #ddd' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button className="btn-primary" onClick={async () => {
                    try {
                      setModalSending(true);
                      const token = localStorage.getItem('google_access_token');
                      const res = await fetch('/api/google-chat/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accessToken: token, space: modalSpace, text: modalText }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || '전송 실패');
                      alert('전송 성공');
                      setModalText('');
                      setShowModal(false);
                    } catch (err) {
                      alert('전송 실패: ' + err.message);
                    } finally {
                      setModalSending(false);
                    }
                  }} disabled={modalSending || !modalText}>전송</button>
                </div>
              </div>
            </div>
          </div>
        )}
      
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
