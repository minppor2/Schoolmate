'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import ForceGraph from '@/components/ForceGraph';
import StickyBoard from '@/components/StickyBoard';
import { ddayInfo, resolveStart } from '@/lib/scheduleUtils';

// 옵시디언 그래프 뷰 스타일 홈: 기능(허브)과 내 데이터(업무·일정·예약)가
// 노드로 연결된 그래프. 드래그로 배치하고, 클릭하면 해당 페이지로 이동한다.
const HUBS = [
  { id: 'inbox', label: '업무함', link: '/inbox', color: '#A5C8ED' },
  { id: 'schedule', label: '일정', link: '/schedule', color: '#B5E3C4' },
  { id: 'reservation', label: '특별실', link: '/reservation', color: '#FFD9A8' },
  { id: 'records', label: '학생기록', link: '/records', color: '#DCC5EA' },
  { id: 'settings', label: '설정', link: '/settings', color: '#D3D7DC' },
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
    const all = JSON.parse(localStorage.getItem('inbox_tasks') || '[]');
    const savedTasks = all.filter(t => t.status === 'saved' && !t.done);
    const candidates = all.filter(t => t.status === 'candidate');
    savedTasks.forEach(t => {
      const info = ddayInfo(t);
      if (info && (info.overdue || info.today || parseInt(info.label.replace('D-', ''), 10) <= 3)) summary.due += 1;
    });
    // 저장한 업무 우선, 자리가 남으면 업무 후보도 표시
    leaves.inbox = [...savedTasks, ...candidates].slice(0, 4).map(t => {
      const info = ddayInfo(t);
      return {
        label: trunc(t.title),
        sub: t.status === 'candidate' ? '후보' : (info ? info.label : null),
        urgent: t.status === 'saved' && !!info && (info.overdue || info.today),
      };
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

  // 허브 파일을 새 창으로 직접 연다 (records 페이지를 거치지 않음)
  leaves.records = [{ label: 'CLASS PLAY HUB', sub: '새 창', urgent: false, link: '/CLASS_PLAY_HUB_v1.3.html', external: true }];

  return { leaves, summary };
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [graph, setGraph] = useState(null);
  const [graphOpen, setGraphOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setGraph(buildGraph());
    try { setGraphOpen(localStorage.getItem('home_graph_open') !== '0'); } catch (e) {}
  }, []);

  function toggleGraph() {
    setGraphOpen(prev => {
      try { localStorage.setItem('home_graph_open', prev ? '0' : '1'); } catch (e) {}
      return !prev;
    });
  }

  // ---------- 그래프 초기 배치 (물리 시뮬레이션 시작점) ----------
  const W = 640, H = 480;
  const { nodes, edges } = useMemo(() => {
    const CX = W / 2, CY = H / 2, R1 = 140, R2 = 90;
    const ns = [];
    const es = [];

    ns.push({ id: 'center', x: CX, y: CY, r: 30, label: '스쿨메이트 AI', color: '#B9D4F2', center: true });

    HUBS.forEach((hub, i) => {
      const angle = (i / HUBS.length) * Math.PI * 2 - Math.PI / 2;
      const x = CX + R1 * Math.cos(angle);
      const y = CY + R1 * Math.sin(angle);
      ns.push({ id: hub.id, x, y, r: 20, label: hub.label, color: hub.color, link: hub.link });
      es.push({ source: 'center', target: hub.id });

      const children = graph ? (graph.leaves[hub.id] || []) : [];
      children.forEach((leaf, j) => {
        const spread = 0.55;
        const childAngle = angle + (j - (children.length - 1) / 2) * spread;
        const id = `${hub.id}_leaf_${j}`;
        ns.push({
          id, x: x + R2 * Math.cos(childAngle), y: y + R2 * Math.sin(childAngle), r: 10,
          label: leaf.label, sub: leaf.sub, color: leaf.urgent ? '#F5B5B0' : hub.color,
          link: leaf.link || hub.link, external: !!leaf.external, leaf: true,
        });
        es.push({ source: hub.id, target: id, faint: true });
      });
    });
    return { nodes: ns, edges: es };
  }, [graph]);

  if (loading || !user) {
    return <div style={{ textAlign: 'center', paddingTop: '100px' }}>로딩 중...</div>;
  }

  const userName = user?.displayName?.split(' ')[0] || '선생님';
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
          <p className="text-caption" style={{ marginTop: 6 }}>그래프의 노드를 끌어서 배치하고, 클릭해 이동하세요.</p>
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ---------- 옵시디언 스타일 그래프 뷰 (드래그 가능, 접기/펴기) ---------- */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', flex: '0 1 480px', minWidth: 320 }}>
          <button
            onClick={toggleGraph}
            aria-expanded={graphOpen}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', background: 'none', border: 'none', borderBottom: graphOpen ? '1px solid var(--color-divider)' : 'none',
              cursor: 'pointer', color: 'var(--color-ink)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
              <Icon name="graph_3" size={18} style={{ color: 'var(--color-primary)' }} /> 내 연결 그래프
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--color-muted-ink)' }}>
              {graphOpen ? '접기' : '펼치기'}
              <Icon name={graphOpen ? 'expand_less' : 'expand_more'} size={20} />
            </span>
          </button>
          {graphOpen && (
            <ForceGraph
              nodes={nodes} edges={edges} width={W} height={H}
              onNavigate={(link, node) => {
                if (node?.external) window.open(link, '_blank', 'noopener');
                else router.push(link);
              }}
            />
          )}
        </div>

        {/* ---------- 포스트잇 메모 보드 ---------- */}
        <StickyBoard style={{ flex: '1 1 340px', minWidth: 300, alignSelf: 'stretch' }} />
      </div>
    </div>
  );
}
