"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import Icon from '@/components/Icon';

const DEFAULT_CONFIG = {
  rooms: ['컴퓨터실', '과학실', '도서관', '음악실'],
  periods: ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'],
};

const CONFIG_KEY = 'resv_config';

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week[d.getDay()]})`;
}

const slotKey = (room, period) => `${room}||${period}`;

function ReservationContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const cloud = !!user && !user.isGuest; // Firebase 로그인 시에만 Firestore 공유 저장

  const [date, setDate] = useState(() => {
    // 업무함 등에서 ?date=YYYY-MM-DD로 진입하면 해당 날짜 예약창을 연다
    const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('date') : null;
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : toDateStr(new Date());
  });

  useEffect(() => {
    const q = searchParams.get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) setDate(q);
  }, [searchParams]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [reservations, setReservations] = useState({});
  const [slotModal, setSlotModal] = useState(null); // { room, period, existing }
  const [configOpen, setConfigOpen] = useState(false);
  const [synced, setSynced] = useState(false);

  // ---------- 설정(특별실/교시) 불러오기 ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.rooms) && parsed.rooms.length && Array.isArray(parsed.periods) && parsed.periods.length) {
          setConfig(parsed);
        }
      }
    } catch (e) {}
    if (!cloud) return;
    try {
      return onSnapshot(doc(db, 'config', 'reservation'), (snap) => {
        const data = snap.data();
        if (data && Array.isArray(data.rooms) && data.rooms.length && Array.isArray(data.periods) && data.periods.length) {
          setConfig({ rooms: data.rooms, periods: data.periods });
        }
      }, (err) => console.error('config sync failed', err));
    } catch (e) { console.error(e); }
  }, [cloud]);

  // ---------- 선택한 날짜의 예약 불러오기 ----------
  useEffect(() => {
    setReservations({});
    try {
      const raw = localStorage.getItem(`resv_${date}`);
      if (raw) setReservations(JSON.parse(raw));
    } catch (e) {}
    if (!cloud) { setSynced(false); return; }
    try {
      return onSnapshot(doc(db, 'reservations', date), (snap) => {
        setSynced(true);
        setReservations(snap.data() || {});
      }, (err) => { console.error('reservation sync failed', err); setSynced(false); });
    } catch (e) { console.error(e); setSynced(false); }
  }, [date, cloud]);

  // ---------- 저장 ----------
  async function persistReservations(next) {
    try { localStorage.setItem(`resv_${date}`, JSON.stringify(next)); } catch (e) {}
    if (cloud) {
      try { await setDoc(doc(db, 'reservations', date), next); }
      catch (e) { console.error('Failed to save reservation', e); alert('클라우드 저장에 실패했습니다. Firestore 설정을 확인하세요.'); }
    }
  }

  async function persistConfig(next) {
    setConfig(next);
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch (e) {}
    if (cloud) {
      try { await setDoc(doc(db, 'config', 'reservation'), next); }
      catch (e) { console.error('Failed to save config', e); }
    }
  }

  function reserve(room, period, name, note) {
    const next = { ...reservations, [slotKey(room, period)]: { name, note, by: user?.uid || 'local' } };
    setReservations(next);
    persistReservations(next);
    setSlotModal(null);
  }

  function cancelReservation(room, period) {
    if (!confirm('이 예약을 취소하시겠습니까?')) return;
    const next = { ...reservations };
    delete next[slotKey(room, period)];
    setReservations(next);
    persistReservations(next);
    setSlotModal(null);
  }

  function shiftDate(days) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(toDateStr(d));
  }

  const navBtn = { padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-hairline)', background: 'white', cursor: 'pointer', fontWeight: 600 };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="text-display">특별실 예약</h2>
          <p className="text-caption" style={{ marginTop: '4px' }}>
            날짜를 선택하고 빈 칸을 클릭해 예약하세요.
            {cloud ? (synced ? ' · ☁ 클라우드 공유 중' : ' · ☁ 연결 중...') : ' · 이 브라우저에만 저장됩니다'}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setConfigOpen(true)}><Icon name="settings" size={16} style={{ marginRight: 4 }} />특별실·교시 설정</button>
      </div>

      {/* ---------- 날짜별 예약창 ---------- */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button style={navBtn} onClick={() => shiftDate(-1)}>◀ 이전 날</button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)', fontFamily: 'inherit' }}
        />
        <strong style={{ fontSize: 17 }}>{dateLabel(date)}</strong>
        <button style={navBtn} onClick={() => shiftDate(1)}>다음 날 ▶</button>
        <button style={{ ...navBtn, background: 'var(--color-primary)', color: 'white', border: 'none' }} onClick={() => setDate(toDateStr(new Date()))}>오늘</button>
      </div>

      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px', borderBottom: '2px solid var(--color-hairline)', color: 'var(--color-muted-ink)', whiteSpace: 'nowrap' }}>구분</th>
              {config.periods.map(p => (
                <th key={p} style={{ padding: '14px', borderBottom: '2px solid var(--color-hairline)', whiteSpace: 'nowrap' }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rooms.map(room => (
              <tr key={room}>
                <td style={{ padding: '14px', borderBottom: '1px solid var(--color-hairline)', fontWeight: '600', whiteSpace: 'nowrap' }}>{room}</td>
                {config.periods.map(period => {
                  const r = reservations[slotKey(room, period)];
                  return (
                    <td key={period} style={{ padding: '6px', borderBottom: '1px solid var(--color-hairline)', minWidth: 90 }}>
                      <button
                        onClick={() => setSlotModal({ room, period, existing: r || null })}
                        title={r ? `${r.name}${r.note ? ' · ' + r.note : ''}` : '예약하기'}
                        style={{
                          width: '100%',
                          padding: '10px 6px',
                          borderRadius: '8px',
                          background: r ? 'var(--color-primary)' : 'var(--color-canvas, #fff)',
                          color: r ? '#FFF' : 'var(--color-primary)',
                          border: r ? '1px solid transparent' : '1px dashed var(--color-primary)',
                          cursor: 'pointer',
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r ? r.name : '예약 가능'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {slotModal && (
        <SlotModal
          {...slotModal}
          dateText={dateLabel(date)}
          onReserve={(name, note) => reserve(slotModal.room, slotModal.period, name, note)}
          onCancelReservation={() => cancelReservation(slotModal.room, slotModal.period)}
          onClose={() => setSlotModal(null)}
        />
      )}

      {configOpen && (
        <ConfigModal
          config={config}
          onSave={(next) => { persistConfig(next); setConfigOpen(false); }}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
}

// ---------- 예약/취소 모달 ----------
function SlotModal({ room, period, existing, dateText, onReserve, onCancelReservation, onClose }) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ width: 'min(420px, 92vw)', background: 'white', borderRadius: 10, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{dateText} · {room} · {period}</h3>
        {existing ? (
          <div>
            <p style={{ margin: '12px 0 4px' }}><b>예약자:</b> {existing.name}</p>
            {existing.note ? <p style={{ margin: '0 0 12px', color: 'var(--color-muted-ink)' }}><b>용도:</b> {existing.note}</p> : null}
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={onClose}>닫기</button>
              <button className="btn-primary" onClick={onCancelReservation}>예약 취소</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="예약자 (예: 3-2 이서영)" autoFocus />
              <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="용도 (선택, 예: 과학 실험 수업)" />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={onClose}>취소</button>
              <button className="btn-primary" onClick={() => { if (!name.trim()) return alert('예약자를 입력하세요.'); onReserve(name.trim(), note.trim()); }}>예약</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 특별실·교시 설정 모달 ----------
function ConfigModal({ config, onSave, onClose }) {
  const [roomsText, setRoomsText] = useState(config.rooms.join('\n'));
  const [periodsText, setPeriodsText] = useState(config.periods.join('\n'));
  const taStyle = { width: '100%', minHeight: 140, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' };

  const parse = (text) => text.split(/\n/).map(s => s.trim()).filter(Boolean);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ width: 'min(560px, 94vw)', background: 'white', borderRadius: 10, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>특별실·교시 설정</h3>
        <p className="text-caption" style={{ marginTop: 0 }}>우리 학교에 맞게 한 줄에 하나씩 입력하세요. 저장하면 예약표에 바로 반영됩니다.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>특별실 목록</label>
            <textarea style={taStyle} value={roomsText} onChange={(e) => setRoomsText(e.target.value)} placeholder={'컴퓨터실\n과학실\n도서관'} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 13 }}>교시 목록</label>
            <textarea style={taStyle} value={periodsText} onChange={(e) => setPeriodsText(e.target.value)} placeholder={'1교시\n2교시\n점심시간\n5교시'} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button
            className="btn-primary"
            onClick={() => {
              const rooms = parse(roomsText);
              const periods = parse(periodsText);
              if (!rooms.length || !periods.length) return alert('특별실과 교시를 각각 1개 이상 입력하세요.');
              onSave({ rooms, periods });
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reservation() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: '80px' }}>로딩 중...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
