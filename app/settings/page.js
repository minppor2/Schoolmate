export default function Settings() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-display">설정</h2>
        <p className="text-caption" style={{ marginTop: '4px' }}>학교 및 개인 설정을 관리합니다.</p>
      </div>
      
      <div className="card" style={{ padding: '24px' }}>
        <h3 className="text-title" style={{ marginBottom: '16px' }}>알림 설정</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-hairline)' }}>
          <span className="text-body">오늘 일정 알림</span>
          <input type="checkbox" defaultChecked />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <span className="text-body">새 업무 후보 알림</span>
          <input type="checkbox" defaultChecked />
        </div>
      </div>
    </div>
  );
}
