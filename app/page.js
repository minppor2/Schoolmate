'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { ddayInfo, resolveStart } from '@/lib/scheduleUtils';

// 옵시디언 그래프 뷰 스타일 홈: 기능(허브)과 내 데이터(업무·일정·예약)가
// 노드로 연결된 그래프. 노드를 클릭하면 해당 페이지로 이동한다.
const HUBS = [
  { id: 'inbox', label: '업무함', link: '/inbox', color: '#818CF8' },
  { id: 'schedule', label: '일정', link: '/schedule', color: '#34D399' },
  { id: 'reservation', label: '특별실', link: '/reservation', color: '#FBBF24' },
  { id: 'records', label: '학생기록', link: '/records', color: '#F472B6' },
  { id: 'settings', label: '설정', link: '/settings', color: '#94A3B8' },
];

const trunc = (s, n = 9) => (s.length > n ? s.slice(0, n) + '…' : s);

function isToday(item) {
  const start = resolveStart(item);
  if (!start) return false;
  const now = new Date();
  return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
}

function buildGraph() {
  const leaves = { inbox: [], schedule: [], reservation: [], records: [], settings: [] };
  const summary = { due: 0, schedules: 0, resv: 0 };

  try {
    const tasks = JSON.parse(localStorage.getItem('inbox_tasks') || '[]').filter(t => t.status === 'saved' && !t.done);
    tasks.forEach(t => {
      const info = ddayInfo(t);
      if (info && (info.overdue || info.today || parseInt(info.label.replace('D-', ''), 10) <= 3)) summary.due += 1;
    });
    leaves.inbox = tasks.slice(0, 3).map(t => {
      const info = ddayInfo(t);
      return { label: trunc(t.title), sub: info ? info.label : null, urgent: info ? (info.overdue || info.today) : false };
    });
  } catch (e) {}

  try {
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    summary.schedules = schedules.filter(isToday).length;
    leaves.schedule = schedules.slice(-3).map(s => ({ label: trunc(s.title), sub: s.time && s.time !== '미정' ? s.time : null, urgent: false }));
  } catch (e) {}

  try {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const raw = localStorage.getItem(`resv_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    const entries = raw ? Object.entries(JSON.parse(raw)) : [];
    summary.resv = entries.length;
    leaves.reservation = entries.slice(0, 3).map(([key]) => {
      const [room, period] = key.split('||');
      return { label: trunc(`${room}`), sub: period, urgent: false };
    });
  } catch (e) {}

  leaves.records = [{ label: 'CLASS PLAY HUB', sub: null, urgent: false }];

  return { leaves, summary };
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [graph, setGraph] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setGraph(buildGraph());
  }, []);

  if (loading || !user) {
    return <div style={{ textAlign: 'center', paddingTop: '100px' }}>로딩 중...</div>;
  }

  const userName = user?.displayName?.split(' ')[0] || '선생님';

  // ---------- 그래프 좌표 계산 ----------
  const W = 860, H = 540, CX = W / 2, CY = H / 2;
  const R1 = 165, R2 = 100;
  const nodes = [];
  const edges = [];

  nodes.push({ id: 'center', x: CX, y: CY, r: 34, label: '스쿨메이트 AI', color: '#C7D2FE', center: true });

  HUBS.forEach((hub, i) => {
    const angle = (i / HUBS.length) * Math.PI * 2 - Math.PI / 2;
    const x = CX + R1 * Math.cos(angle);
    const y = CY + R1 * Math.sin(angle);
    nodes.push({ id: hub.id, x, y, r: 22, label: hub.label, color: hub.color, link: hub.link });
    edges.push({ from: { x: CX, y: CY }, to: { x, y } });

    const children = graph ? (graph.leaves[hub.id] || []) : [];
    children.forEach((leaf, j) => {
      const spread = 0.55;
      const childAngle = angle + (j - (children.length - 1) / 2) * spread;
      const lx = x + R2 * Math.cos(childAngle);
      const ly = y + R2 * Math.sin(childAngle);
      nodes.push({
        id: `${hub.id}_leaf_${j}`, x: lx, y: ly, r: 11,
        label: leaf.label, sub: leaf.sub, color: leaf.urgent ? '#F87171' : hub.color,
        link: hub.link, leaf: true,
      });
      edges.push({ from: { x, y }, to: { x: lx, y: ly }, faint: true });
    });
  });

  const summary = graph?.summary || { due: 0, schedules: 0, resv: 0 };
  const chips = [
    { icon: 'assignment_late', label: `마감 임박 업무 ${summary.due}건`, link: '/inbox', warn: summary.due > 0 },
    { icon: 'event', label: `오늘 일정 ${summary.schedules}건`, link: '/schedule', warn: false },
    { icon: 'school', label: `오늘 특별실 예약 ${summary.resv}건`, link: '/reservation', warn: false },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-display" style={{ margin: 0 }}>{userName}님, 안녕하세요!</h1>
          <p className="text-caption" style={{ marginTop: 6 }}>내 업무와 도구가 연결된 그래프입니다. 노드를 클릭해 이동하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chips.map(chip => (
            <button
              key={chip.label}
              onClick={() => router.push(chip.link)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
                border: '1px solid var(--color-hairline)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: chip.warn ? '#FEF2F2' : 'white',
                color: chip.warn ? 'var(--color-status-red)' : 'var(--color-ink)',
              }}
            >
              <Icon name={chip.icon} size={16} /> {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- 옵시디언 스타일 그래프 뷰 ---------- */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'radial-gradient(circle at 30% 20%, #1a2247, #0b0f1e 70%)', border: '1px solid #232a4d' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y}
              stroke="#8b9dc3" strokeWidth={e.faint ? 0.8 : 1.4} strokeOpacity={e.faint ? 0.25 : 0.4}
            />
          ))}
          {nodes.map(node => {
            const isHover = hover === node.id;
            return (
              <g
                key={node.id}
                onClick={() => node.link && router.push(node.link)}
                onMouseEnter={() => setHover(node.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: node.link ? 'pointer' : 'default' }}
              >
                <circle
                  cx={node.x} cy={node.y}
                  r={isHover ? node.r * 1.25 : node.r}
                  fill={node.color}
                  fillOpacity={node.leaf ? 0.85 : 1}
                  style={{ transition: 'r 0.15s', filter: `drop-shadow(0 0 ${isHover ? 14 : 6}px ${node.color})` }}
                />
                {node.center && (
                  <circle cx={node.x} cy={node.y} r={node.r + 8} fill="none" stroke="#C7D2FE" strokeOpacity="0.3" strokeWidth="1.5" />
                )}
                <text
                  x={node.x} y={node.y + node.r + (node.leaf ? 14 : 18)}
                  textAnchor="middle"
                  fill={isHover ? '#ffffff' : '#c9d4f0'}
                  fontSize={node.center ? 15 : node.leaf ? 10.5 : 13}
                  fontWeight={node.center ? 800 : node.leaf ? 500 : 700}
                  style={{ userSelect: 'none' }}
                >
                  {node.label}
                </text>
                {node.sub && (
                  <text x={node.x} y={node.y + node.r + 27} textAnchor="middle" fill="#8b9dc3" fontSize="9.5" style={{ userSelect: 'none' }}>
                    {node.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-fine" style={{ marginTop: 10, textAlign: 'center' }}>
        업무를 저장하거나 일정·예약을 만들면 그래프에 노드가 자라납니다 🌱
      </p>
    </div>
  );
}
