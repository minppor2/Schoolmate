'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// 홈 화면 포스트잇 메모 보드.
// 메모를 추가하고 마우스로 끌어 자유롭게 배치한다. localStorage에 저장.
const STORAGE_KEY = 'sticky_notes';
const COLORS = ['#FFF3B0', '#FFD6E0', '#D4F0FF', '#DFF5D8', '#F3E5FF'];

function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function StickyBoard({ style }) {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const boardRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}
  }, [notes, loaded]);

  function addNote() {
    setNotes(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x: 16 + (prev.length % 4) * 34,
      y: 16 + ((prev.length * 40) % 200),
      text: '',
      color: COLORS[prev.length % COLORS.length],
      rot: (Math.random() * 4 - 2).toFixed(1),
      date: todayLabel(),
    }]);
  }

  const updateNote = (id, patch) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  const removeNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  // ---------- 드래그 ----------
  function onHeaderDown(note, e) {
    e.preventDefault();
    const board = boardRef.current.getBoundingClientRect();
    dragRef.current = { id: note.id, dx: e.clientX - board.left - note.x, dy: e.clientY - board.top - note.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onBoardMove(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const board = boardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(board.width - 190, e.clientX - board.left - drag.dx));
    const y = Math.max(0, Math.min(board.height - 60, e.clientY - board.top - drag.dy));
    updateNote(drag.id, { x, y });
  }

  const endDrag = () => { dragRef.current = null; };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--color-divider)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
          <Icon name="sticky_note_2" size={18} style={{ color: '#E9B949' }} /> 오늘의 메모
        </span>
        <button
          onClick={addNote}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--color-hairline)', background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}
        >
          <Icon name="add" size={15} /> 메모 추가
        </button>
      </div>

      <div
        ref={boardRef}
        onPointerMove={onBoardMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          position: 'relative', flex: 1, minHeight: 380,
          background: 'radial-gradient(circle, #E8E8EC 1px, transparent 1px) 0 0 / 18px 18px, var(--color-pearl)',
          touchAction: 'none',
        }}
      >
        {notes.length === 0 && (
          <p style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-ink)', fontSize: 13.5, margin: 0 }}>
            "메모 추가"를 눌러 포스트잇을 붙여보세요. 마우스로 끌어 자유롭게 배치할 수 있습니다.
          </p>
        )}
        {notes.map(note => (
          <div
            key={note.id}
            style={{
              position: 'absolute', left: note.x, top: note.y, width: 180,
              background: note.color, borderRadius: 6,
              boxShadow: '0 6px 14px rgba(0,0,0,0.16)',
              transform: `rotate(${note.rot}deg)`,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              onPointerDown={(e) => onHeaderDown(note, e)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 0', cursor: 'grab' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)' }}>{note.date}</span>
              <button
                onClick={() => removeNote(note.id)}
                aria-label="메모 삭제"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', padding: 2, lineHeight: 1 }}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => updateNote(note.id, { text: e.target.value })}
              placeholder="메모..."
              style={{
                width: '100%', minHeight: 84, padding: '6px 10px 10px',
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, color: '#333',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
