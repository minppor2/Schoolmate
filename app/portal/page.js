"use client";
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_CARDS = [
  { id: 'classplay', title: 'CLASS PLAY HUB', desc: '교육 포털 열기', src: '/CLASS_PLAY_HUB_v1.3.html', icon: '📚', usageCount:0, lastUsed:null },
  { id: 'inbox', title: '업무함', desc: '업무 후보 및 메시지', src: '/inbox', icon: '📥', usageCount:0, lastUsed:null },
  { id: 'schedule', title: '일정', desc: '일정 확인 및 생성', src: '/schedule', icon: '📅', usageCount:0, lastUsed:null },
  { id: 'records', title: '기록', desc: '학생 기록 확인', src: '/records', icon: '📝', usageCount:0, lastUsed:null },
  { id: 'reservation', title: '예약', desc: '시설/자원 예약', src: '/reservation', icon: '📌', usageCount:0, lastUsed:null },
  { id: 'settings', title: '설정', desc: '앱 설정', src: '/settings', icon: '⚙️', usageCount:0, lastUsed:null }
];

const STORAGE_KEY = 'portal_cards';

function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CARDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CARDS;
    // ensure fields exist
    return parsed.map(p => ({ usageCount:0, lastUsed:null, icon:'🔗', ...p }));
  } catch (e) {
    return DEFAULT_CARDS;
  }
}

function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save portal cards', e);
  }
}

export default function Portal() {
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('title_asc');
  const [adminOpen, setAdminOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const c = loadCards();
    setCards(c);
  }, []);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cards.filter(c => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
    if (sortKey === 'title_asc') list = list.sort((a,b)=>a.title.localeCompare(b.title));
    else if (sortKey === 'title_desc') list = list.sort((a,b)=>b.title.localeCompare(a.title));
    else if (sortKey === 'usage_desc') list = list.sort((a,b)=>(b.usageCount||0)-(a.usageCount||0));
    else if (sortKey === 'recent_desc') list = list.sort((a,b)=>{
      const ta = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const tb = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return tb - ta;
    });
    else if (sortKey === 'auto') list = list.sort((a,b)=>(b.usageCount||0)-(a.usageCount||0));
    return list;
  }, [cards, query, sortKey]);

  function handleAddOrUpdate(card) {
    if (!card.id) card.id = String(Date.now());
    setCards(prev => {
      const exists = prev.findIndex(p => p.id === card.id);
      if (exists >= 0) {
        const copy = [...prev];
        // preserve usage fields if not provided
        copy[exists] = { usageCount: prev[exists].usageCount||0, lastUsed: prev[exists].lastUsed||null, ...card };
        return copy;
      }
      return [{ usageCount:0, lastUsed:null, ...card }, ...prev];
    });
    setAdminOpen(false);
    setEditing(null);
  }

  function handleDelete(id) {
    if (!confirm('삭제하시겠습니까?')) return;
    setCards(prev => prev.filter(p => p.id !== id));
  }

  function incrementUsage(id) {
    const now = new Date().toISOString();
    let updatedCard = null;
    setCards(prev => {
      const copy = prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, usageCount: (c.usageCount||0) + 1, lastUsed: now };
          updatedCard = updated;
          return updated;
        }
        return c;
      });
      return copy;
    });
    return updatedCard;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 className="text-display">학생기록 도우미 포털</h1>
          <p className="text-caption">자주 사용하는 서비스에 빠르게 접근하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="검색" value={query} onChange={(e)=>setQuery(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)' }} />
          <select value={sortKey} onChange={(e)=>setSortKey(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8 }}>
            <option value="title_asc">이름 오름차순</option>
            <option value="title_desc">이름 내림차순</option>
          </select>
          <button className="btn-secondary" onClick={() => { setAdminOpen(true); setEditing(null); }}>관리</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {filtered.map(card => (
          <div key={card.id} className="card" style={{ padding: 18, borderRadius: 12, cursor: 'pointer', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 28 }}>
                {typeof card.icon === 'string' && card.icon.startsWith('data:') ? (
                  <img src={card.icon} alt="icon" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                ) : (typeof card.icon === 'string' && (card.icon.startsWith('http') || card.icon.startsWith('/')) ? (
                  <img src={card.icon} alt="icon" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <span>{card.icon || '🔗'}</span>
                ))}
              </div>
              <h3 style={{ margin: '8px 0 0' }}>{card.title}</h3>
              <div style={{ marginTop: 8, color: 'var(--color-muted-ink)' }}>{card.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted-ink)' }}>{card.src}</div>
              <div>
                <button className="btn-utility" onClick={() => { incrementUsage(card.id); setOpen(card); }}>열기</button>
                <button className="btn-secondary" onClick={() => { setEditing(card); setAdminOpen(true); }}>편집</button>
                <button className="btn-primary" onClick={() => handleDelete(card.id)}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setOpen(null)}>
          <div style={{ width: 'min(1100px,94vw)', height: '86vh', background: 'white', borderRadius: 10, overflow: 'hidden' }} onClick={(e)=>e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>{open.title}</div>
              <div>
                <a href={open.src} target="_blank" rel="noreferrer"><button className="btn-secondary" style={{ marginRight: 8 }}>새창</button></a>
                <button className="btn-primary" onClick={() => setOpen(null)}>닫기</button>
              </div>
            </div>
            <iframe src={open.src} style={{ width: '100%', height: 'calc(100% - 56px)', border: 0 }} title={open.title}></iframe>
          </div>
        </div>
      )}

      {adminOpen && (
        <AdminPanel
          initial={editing}
          onClose={() => { setAdminOpen(false); setEditing(null); }}
          onSave={(c)=>handleAddOrUpdate(c)}
        />
      )}
    </div>
  );
}

function AdminPanel({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [desc, setDesc] = useState(initial?.desc || '');
  const [src, setSrc] = useState(initial?.src || '');
  const [icon, setIcon] = useState(initial?.icon || '🔗');
  const [imagePreview, setImagePreview] = useState(initial?.icon && (initial.icon.startsWith('data:') || initial.icon.startsWith('http') || initial.icon.startsWith('/')) ? initial.icon : null);

  useEffect(() => {
    setTitle(initial?.title || '');
    setDesc(initial?.desc || '');
    setSrc(initial?.src || '');
    setIcon(initial?.icon || '🔗');
    setImagePreview(initial?.icon && (initial.icon.startsWith('data:') || initial.icon.startsWith('http') || initial.icon.startsWith('/')) ? initial.icon : null);
  }, [initial]);

  const handleSave = () => {
    if (!title || !src) return alert('제목과 링크(URL)를 입력하세요.');
    onSave({ id: initial?.id || String(Date.now()), title, desc, src, icon });
  };

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const data = ev.target.result;
      setIcon(data);
      setImagePreview(data);
    };
    reader.readAsDataURL(f);
  }

  function removeImage() {
    setIcon('🔗');
    setImagePreview(null);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ width: 720, background: 'white', borderRadius: 8, padding: 20 }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{initial ? '카드 편집' : '카드 추가'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" />
          <div>
            <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder="아이콘(이모지 권장)" />
            <div style={{ marginTop: 8 }}>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {imagePreview && (
                <div style={{ marginTop: 8 }}>
                  <img src={imagePreview} alt="preview" style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  <div><button className="btn-secondary" onClick={removeImage}>이미지 제거</button></div>
                </div>
              )}
            </div>
          </div>
          <input style={{ gridColumn: '1/-1' }} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="설명" />
          <input style={{ gridColumn: '1/-1' }} value={src} onChange={e=>setSrc(e.target.value)} placeholder="링크 (내부 경로 또는 외부 URL)" />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}

