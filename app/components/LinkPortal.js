"use client";
import { useEffect, useState } from 'react';

// 웹페이지 링크를 카드로 보여주는 포털 그리드.
// storageKey별로 localStorage에 저장되므로 페이지마다 독립적인 목록을 가질 수 있다.
export default function LinkPortal({ storageKey, defaultLinks = [] }) {
  const [links, setLinks] = useState(defaultLinks);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setLinks(parsed);
      }
    } catch (e) {
      console.error('Failed to load links', e);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(links));
    } catch (e) {
      console.error('Failed to save links', e);
    }
  }, [links, loaded, storageKey]);

  function handleSave(link) {
    setLinks(prev => {
      const idx = prev.findIndex(l => l.id === link.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = link;
        return copy;
      }
      return [...prev, link];
    });
    setEditorOpen(false);
    setEditing(null);
  }

  function handleDelete(id) {
    if (!confirm('이 카드를 삭제하시겠습니까?')) return;
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-primary" onClick={() => { setEditing(null); setEditorOpen(true); }}>
          + 웹페이지 추가
        </button>
      </div>

      {links.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted-ink)' }}>
          <p>등록된 웹페이지가 없습니다. 오른쪽 위 "+ 웹페이지 추가"로 자주 쓰는 페이지를 등록하세요.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {links.map(link => (
            <div
              key={link.id}
              className="card"
              role="button"
              tabIndex={0}
              onClick={() => setOpen(link)}
              onKeyDown={(e) => { if (e.key === 'Enter') setOpen(link); }}
              style={{ padding: 18, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ fontSize: 30 }}>{link.icon || '🔗'}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{link.title}</h3>
                {link.desc ? (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted-ink)' }}>{link.desc}</p>
                ) : null}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                  {link.url}
                </span>
                <span style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { setEditing(link); setEditorOpen(true); }}>편집</button>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleDelete(link.id)}>삭제</button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setOpen(null)}
        >
          <div
            style={{ width: 'min(1100px, 94vw)', height: '86vh', background: 'white', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--color-hairline)' }}>
              <div style={{ fontWeight: 700 }}>{open.icon} {open.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted-ink)' }}>
                  화면이 비어 있으면 삽입이 차단된 사이트입니다 → 새 창으로 여세요
                </span>
                <a href={open.url} target="_blank" rel="noreferrer noopener">
                  <button className="btn-secondary">새 창</button>
                </a>
                <button className="btn-primary" onClick={() => setOpen(null)}>닫기</button>
              </div>
            </div>
            <iframe src={open.url} title={open.title} style={{ flex: 1, width: '100%', border: 0 }} />
          </div>
        </div>
      )}

      {editorOpen && (
        <LinkEditor
          initial={editing}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function LinkEditor({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [desc, setDesc] = useState(initial?.desc || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [icon, setIcon] = useState(initial?.icon || '🔗');

  const handleSave = () => {
    if (!title.trim() || !url.trim()) return alert('제목과 링크(URL)를 입력하세요.');
    onSave({ id: initial?.id || String(Date.now()), title: title.trim(), desc: desc.trim(), url: url.trim(), icon: icon.trim() || '🔗' });
  };

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-hairline)' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
      onClick={onClose}
    >
      <div style={{ width: 'min(520px, 92vw)', background: 'white', borderRadius: 10, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{initial ? '카드 편집' : '웹페이지 추가'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="제목 (예: CLASS PLAY HUB)" />
          <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="설명 (선택)" />
          <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="링크 — 내부 경로(/...) 또는 외부 URL(https://...)" />
          <input style={inputStyle} value={icon} onChange={e => setIcon(e.target.value)} placeholder="아이콘 이모지 (예: 📚)" />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}
