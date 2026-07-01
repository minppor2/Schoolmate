export default function Records() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-display">학생기록 도우미</h2>
        <p className="text-caption" style={{ marginTop: '4px' }}>세특 점검 및 자료 보관소입니다.</p>
      </div>

      <div style={{ borderBottom: '1px solid var(--color-hairline)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        <button style={{ paddingBottom: '12px', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: '600', background: 'none' }}>내 자료실</button>
        <button style={{ paddingBottom: '12px', color: 'var(--color-muted-ink)', background: 'none' }}>세특 점검</button>
        <button style={{ paddingBottom: '12px', color: 'var(--color-muted-ink)', background: 'none' }}>지침 파일</button>
      </div>
      
      <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted-ink)' }}>
        <p>저장된 자료가 없습니다.</p>
      </div>
    </div>
  );
}
