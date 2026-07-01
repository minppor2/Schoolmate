"use client";
import { useState } from 'react';

export default function Schedule() {
  const [schedules, setSchedules] = useState([
    { id: 1, title: '학년부 회의', date: '오늘', time: '10:30' },
    { id: 2, title: '체험학습 답사', date: '7월 3일', time: '14:00' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const handleAdd = () => {
    if (!newTitle || !newDate) return;
    setSchedules([...schedules, { id: Date.now(), title: newTitle, date: newDate, time: '미정' }]);
    setNewTitle('');
    setNewDate('');
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-display">일정</h2>
          <p className="text-caption" style={{ marginTop: '4px' }}>개인 및 학교 일정을 확인하고 등록합니다.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>새 일정</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schedules.map(sch => (
          <div key={sch.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
            <div>
              <h4 className="text-body-strong">{sch.title}</h4>
              <span className="text-caption">📅 {sch.date} ⏰ {sch.time}</span>
            </div>
            <button className="btn-utility" onClick={() => setSchedules(schedules.filter(s => s.id !== sch.id))}>삭제</button>
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
