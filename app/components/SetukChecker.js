'use client';

import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '@/components/Icon';
import { LIMITS, checkText, maskName } from '@/lib/setukRules';

// 세특(서술형 항목) 일괄 점검기.
// 개인정보 보호 원칙: 업로드 파일은 서버로 전송하지 않고 브라우저 메모리에서만
// 처리하며, 어디에도 저장하지 않는다(새로고침 시 소멸). 학생 이름은 마스킹 표시.
export default function SetukChecker() {
  const [rows, setRows] = useState(null);       // 엑셀 원본 (배열의 배열, [0]=헤더)
  const [fileName, setFileName] = useState('');
  const [contentCol, setContentCol] = useState(0);
  const [nameCol, setNameCol] = useState(-1);   // -1 = 없음
  const [limitId, setLimitId] = useState('subject');
  const [filter, setFilter] = useState('all');  // all | error | warn
  const [expanded, setExpanded] = useState(null);
  const [quickText, setQuickText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const limit = LIMITS.find(l => l.id === limitId) || LIMITS[0];

  // ---------- 파일 읽기 (브라우저 내부에서만) ----------
  async function handleFile(file) {
    if (!file) return;
    setError('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const cleaned = data.filter(r => Array.isArray(r) && r.some(c => String(c).trim() !== ''));
      if (cleaned.length < 2) { setError('데이터가 없습니다. 첫 행은 제목(헤더), 둘째 행부터 내용이 있어야 합니다.'); return; }

      // 내용 열 자동 감지: 평균 글자수가 가장 긴 열
      const header = cleaned[0].map(c => String(c));
      const body = cleaned.slice(1);
      let bestCol = 0, bestAvg = -1;
      header.forEach((_, ci) => {
        const lens = body.map(r => String(r[ci] || '').length);
        const avg = lens.reduce((a, b) => a + b, 0) / Math.max(lens.length, 1);
        if (avg > bestAvg) { bestAvg = avg; bestCol = ci; }
      });
      // 이름 열 자동 감지: 헤더에 이름/성명 포함
      const nc = header.findIndex(hcell => /이름|성명/.test(hcell));

      setRows(cleaned);
      setFileName(file.name);
      setContentCol(bestCol);
      setNameCol(nc);
      setExpanded(null);
      setFilter('all');
    } catch (e) {
      setError('파일을 읽지 못했습니다: ' + e.message);
    }
  }

  // ---------- 점검 실행 ----------
  const results = useMemo(() => {
    if (!rows) return null;
    return rows.slice(1).map((r, i) => {
      const text = String(r[contentCol] || '').trim();
      const res = checkText(text, limit.max);
      const hasError = res.overLimit || res.issues.some(x => x.severity === 'error');
      const hasWarn = res.issues.some(x => x.severity === 'warn');
      return {
        rowNo: i + 2, // 엑셀 기준 행 번호 (헤더 다음부터)
        name: nameCol >= 0 ? maskName(r[nameCol]) : null,
        text, ...res,
        level: !text ? 'empty' : hasError ? 'error' : hasWarn ? 'warn' : 'ok',
      };
    }).filter(r => r.level !== 'empty');
  }, [rows, contentCol, nameCol, limit]);

  const counts = useMemo(() => {
    if (!results) return null;
    return {
      total: results.length,
      ok: results.filter(r => r.level === 'ok').length,
      warn: results.filter(r => r.level === 'warn').length,
      error: results.filter(r => r.level === 'error').length,
    };
  }, [results]);

  const visible = results ? results.filter(r => filter === 'all' ? true : r.level === filter).slice(0, 300) : [];

  const quickResult = quickText.trim() ? checkText(quickText, limit.max) : null;

  const header = rows ? rows[0].map(c => String(c)) : [];
  const selStyle = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-hairline)', fontFamily: 'inherit', fontSize: 13 };
  const badge = (level) => level === 'error'
    ? { background: '#FEE2E2', color: '#B91C1C', label: '위반 의심' }
    : level === 'warn'
      ? { background: '#FEF3C7', color: '#B45309', label: '확인 필요' }
      : { background: '#DCFCE7', color: '#15803D', label: '통과' };

  // 본문에서 발견 키워드 강조
  function highlight(text, issues) {
    const words = [...new Set(issues.flatMap(i => i.matches))].filter(Boolean);
    if (!words.length) return text;
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
    return parts.map((p, i) =>
      words.includes(p)
        ? <mark key={i} style={{ background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, borderRadius: 3, padding: '0 2px' }}>{p}</mark>
        : p
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ---------- 개인정보 보호 안내 ---------- */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F0F7FF', border: '1px solid #BFDBFE' }}>
        <Icon name="lock" size={20} style={{ color: 'var(--color-primary)', marginTop: 2 }} />
        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#1E3A5F' }}>
          <b>개인정보 보호 안내</b> — 업로드한 파일은 <b>서버로 전송되지 않고 이 브라우저 안에서만 분석</b>됩니다.
          어디에도 저장되지 않으며 새로고침하면 사라집니다. 학생 이름은 화면에 자동 마스킹(홍*동)되어 표시됩니다.
        </div>
      </div>

      {/* ---------- 업로드 + 설정 ---------- */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 className="text-title" style={{ margin: 0 }}>엑셀 업로드 점검</h3>
        <p className="text-caption" style={{ margin: 0 }}>
          나이스에서 내려받은 자료나 점검용 엑셀(.xlsx, .xls, .csv)을 올리면
          「2026 학교생활기록부 기재 길라잡이」 기준으로 글자수·기재불가 사항을 일괄 점검합니다.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button className="btn-primary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload_file" size={17} style={{ marginRight: 6 }} />엑셀 파일 선택
          </button>
          {fileName && <span className="text-caption">📄 {fileName}</span>}
          <select style={selStyle} value={limitId} onChange={(e) => setLimitId(e.target.value)}>
            {LIMITS.map(l => <option key={l.id} value={l.id}>{l.label} (최대 {l.max}자)</option>)}
          </select>
        </div>
        {rows && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="text-caption">점검할 내용 열:</label>
            <select style={selStyle} value={contentCol} onChange={(e) => setContentCol(+e.target.value)}>
              {header.map((hc, i) => <option key={i} value={i}>{hc || `열 ${i + 1}`}</option>)}
            </select>
            <label className="text-caption">이름 열(마스킹용):</label>
            <select style={selStyle} value={nameCol} onChange={(e) => setNameCol(+e.target.value)}>
              <option value={-1}>없음</option>
              {header.map((hc, i) => <option key={i} value={i}>{hc || `열 ${i + 1}`}</option>)}
            </select>
          </div>
        )}
        {error && <div className="text-caption" style={{ color: 'var(--color-status-red)' }}>{error}</div>}
      </div>

      {/* ---------- 결과 요약 + 목록 ---------- */}
      {counts && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `전체 ${counts.total}건`, bg: 'white', color: 'var(--color-ink)' },
              { key: 'error', label: `위반 의심 ${counts.error}건`, bg: '#FEE2E2', color: '#B91C1C' },
              { key: 'warn', label: `확인 필요 ${counts.warn}건`, bg: '#FEF3C7', color: '#B45309' },
              { key: 'ok', label: `통과 ${counts.ok}건`, bg: '#DCFCE7', color: '#15803D' },
            ].map(c => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key === 'ok' ? 'ok' : c.key)}
                style={{
                  padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                  background: c.bg, color: c.color,
                  border: filter === c.key ? '2px solid currentColor' : '1px solid var(--color-hairline)',
                }}
              >{c.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.length === 0 && (
              <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted-ink)' }}>해당하는 행이 없습니다.</div>
            )}
            {visible.map(r => {
              const b = badge(r.level);
              const isOpen = expanded === r.rowNo;
              return (
                <div key={r.rowNo} className="card" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : r.rowNo)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="text-fine" style={{ color: 'var(--color-muted-ink)', minWidth: 46 }}>{r.rowNo}행</span>
                    {r.name && <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</span>}
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: b.background, color: b.color }}>{b.label}</span>
                    <span className="text-fine" style={{ color: r.overLimit ? '#B91C1C' : 'var(--color-muted-ink)', fontWeight: r.overLimit ? 700 : 400 }}>
                      {r.length}/{r.max}자{r.overLimit ? ' 초과!' : ''}
                    </span>
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {r.issues.map(is => (
                        <span key={is.id} className="text-fine" style={{ padding: '2px 8px', borderRadius: 999, background: is.severity === 'error' ? '#FEE2E2' : '#FEF3C7', color: is.severity === 'error' ? '#B91C1C' : '#B45309' }}>
                          {is.category}
                        </span>
                      ))}
                    </span>
                    <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} style={{ marginLeft: 'auto', color: 'var(--color-muted-ink)' }} />
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--color-divider)', paddingTop: 12 }}>
                      <p style={{ fontSize: 13.5, lineHeight: 1.8, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{highlight(r.text, r.issues)}</p>
                      {r.issues.map(is => (
                        <div key={is.id} className="text-caption" style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                          <Icon name={is.severity === 'error' ? 'cancel' : 'warning'} size={15} style={{ color: is.severity === 'error' ? '#B91C1C' : '#B45309', marginTop: 2 }} />
                          <span><b>{is.category}</b> ({is.matches.join(', ')}) — {is.desc}</span>
                        </div>
                      ))}
                      {r.overLimit && (
                        <div className="text-caption" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Icon name="cancel" size={15} style={{ color: '#B91C1C' }} />
                          <span><b>글자수 초과</b> — {limit.label}은 최대 {limit.max}자(한글 기준)까지 입력 가능합니다.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {results && results.length > 300 && (
              <p className="text-fine" style={{ textAlign: 'center' }}>표시는 300행까지 지원합니다. 필터로 좁혀서 확인하세요.</p>
            )}
          </div>
        </>
      )}

      {/* ---------- 텍스트 직접 점검 ---------- */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 className="text-title" style={{ margin: 0 }}>텍스트 직접 점검</h3>
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder="세특 문장을 붙여넣으면 즉시 점검합니다. (입력 내용은 저장되지 않습니다)"
          style={{ minHeight: 90, padding: 12, border: '1px solid var(--color-hairline)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13.5 }}
        />
        {quickResult && (
          <div style={{ fontSize: 13.5 }}>
            <span style={{ fontWeight: 700, color: quickResult.overLimit ? '#B91C1C' : '#15803D' }}>
              {quickResult.length}/{quickResult.max}자{quickResult.overLimit ? ' — 초과!' : ''}
            </span>
            {quickResult.issues.length === 0 && !quickResult.overLimit && <span style={{ marginLeft: 8, color: '#15803D' }}>✓ 발견된 문제가 없습니다.</span>}
            {quickResult.issues.map(is => (
              <div key={is.id} className="text-caption" style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 6 }}>
                <Icon name={is.severity === 'error' ? 'cancel' : 'warning'} size={15} style={{ color: is.severity === 'error' ? '#B91C1C' : '#B45309', marginTop: 2 }} />
                <span><b>{is.category}</b> ({is.matches.join(', ')}) — {is.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
