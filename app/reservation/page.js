"use client";
import { useState } from 'react';

export default function Reservation() {
  const rooms = ['컴퓨터실', '과학실', '도서관', '음악실'];
  const periods = [1, 2, 3, 4, 5, 6];
  
  // Create an initial state where everything is available (null) except one taken slot
  const initialState = rooms.map(room => ({
    room,
    slots: periods.map(p => (room === '과학실' && p === 2) ? '예약됨 (타교사)' : null)
  }));
  
  const [grid, setGrid] = useState(initialState);

  const toggleReservation = (roomIndex, periodIndex) => {
    const current = grid[roomIndex].slots[periodIndex];
    if (current === '예약됨 (타교사)') return; // Cannot touch other's reservation

    const newGrid = [...grid];
    if (current === '내 예약') {
      newGrid[roomIndex].slots[periodIndex] = null; // Cancel
    } else {
      newGrid[roomIndex].slots[periodIndex] = '내 예약'; // Reserve
    }
    setGrid(newGrid);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-display">특별실 예약</h2>
          <p className="text-caption" style={{ marginTop: '4px' }}>원하는 교시의 빈 칸을 클릭하여 예약하세요.</p>
        </div>
      </div>
      
      <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', borderBottom: '2px solid var(--color-hairline)', color: 'var(--color-muted-ink)' }}>구분</th>
              {periods.map(p => (
                <th key={p} style={{ padding: '16px', borderBottom: '2px solid var(--color-hairline)' }}>{p}교시</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rIdx) => (
              <tr key={row.room}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--color-divider)', fontWeight: '600' }}>{row.room}</td>
                {row.slots.map((status, pIdx) => (
                  <td key={pIdx} style={{ padding: '8px', borderBottom: '1px solid var(--color-divider)' }}>
                    <button 
                      onClick={() => toggleReservation(rIdx, pIdx)}
                      style={{
                        width: '100%',
                        padding: '12px 8px',
                        borderRadius: '8px',
                        background: status === '내 예약' ? 'var(--color-primary)' : status === '예약됨 (타교사)' ? 'var(--color-parchment)' : 'var(--color-canvas)',
                        color: status === '내 예약' ? '#FFF' : status === '예약됨 (타교사)' ? 'var(--color-muted-ink)' : 'var(--color-primary)',
                        border: status === null ? '1px dashed var(--color-primary)' : '1px solid transparent',
                        cursor: status === '예약됨 (타교사)' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {status === null ? '예약 가능' : status}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
