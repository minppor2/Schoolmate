"use client";
import { useEffect, useState } from 'react';
import { loadNotiSettings, saveNotiSettings, DEFAULT_NOTI_SETTINGS } from '@/lib/notifications';

export default function Settings() {
  const [noti, setNoti] = useState(DEFAULT_NOTI_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNoti(loadNotiSettings());
    setLoaded(true);
  }, []);

  function update(patch) {
    setNoti(prev => {
      const next = { ...prev, ...patch };
      saveNotiSettings(next);
      return next;
    });
  }

  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-hairline)' };

  if (!loaded) return null;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-display">설정</h2>
        <p className="text-caption" style={{ marginTop: '4px' }}>학교 및 개인 설정을 관리합니다.</p>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 className="text-title" style={{ marginBottom: '8px' }}>알림 설정</h3>
        <p className="text-caption" style={{ marginTop: 0 }}>마감 임박 업무, 오늘 일정, 오늘 특별실 예약을 알려드립니다.</p>

        <div style={row}>
          <div>
            <span className="text-body">알림 사용</span>
            <p className="text-fine" style={{ marginTop: 2 }}>끄면 자동 팝업과 종 모양 배지가 모두 비활성화됩니다.</p>
          </div>
          <input type="checkbox" checked={noti.enabled} onChange={(e) => update({ enabled: e.target.checked })} style={{ width: 18, height: 18 }} />
        </div>

        <div style={row}>
          <div>
            <span className="text-body">접속 시 자동 팝업</span>
            <p className="text-fine" style={{ marginTop: 2 }}>하루에 한 번, 알림이 있을 때 자동으로 알림창을 띄웁니다.</p>
          </div>
          <input type="checkbox" checked={noti.autoPopup} disabled={!noti.enabled} onChange={(e) => update({ autoPopup: e.target.checked })} style={{ width: 18, height: 18 }} />
        </div>

        <div style={{ ...row, borderBottom: 'none' }}>
          <div>
            <span className="text-body">업무 마감 알림 시점</span>
            <p className="text-fine" style={{ marginTop: 2 }}>마감 며칠 전부터 알림에 표시할지 정합니다.</p>
          </div>
          <select
            value={noti.days}
            disabled={!noti.enabled}
            onChange={(e) => update({ days: +e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-hairline)' }}
          >
            {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>D-{d}부터</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
