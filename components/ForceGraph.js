'use client';

import { useEffect, useMemo, useReducer, useRef } from 'react';

// 옵시디언 그래프 뷰처럼 동작하는 힘-기반(force-directed) 그래프.
// - 노드는 스프링(간선)·반발력·중력으로 계속 살아 움직인다
// - 마우스/터치로 노드를 드래그해 자유롭게 배치할 수 있다
// - 드래그 없이 짧게 클릭하면 onNavigate(link) 호출
export default function ForceGraph({ nodes: initialNodes, edges: initialEdges, width: W, height: H, onNavigate }) {
  const simRef = useRef(null);
  const dragRef = useRef(null);
  const hoverRef = useRef(null);
  const alphaRef = useRef(1);
  const svgRef = useRef(null);
  const [, bump] = useReducer(x => x + 1, 0);

  const nodesKey = initialNodes.map(n => n.id).join('|');

  // ---------- 시뮬레이션 초기화 (렌더와 동기 — 첫 화면부터 그려지도록) ----------
  const sim = useMemo(() => {
    const nodes = initialNodes.map(n => ({ ...n, vx: 0, vy: 0 }));
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const edges = initialEdges
      .filter(e => byId[e.source] && byId[e.target])
      .map(e => {
        const a = byId[e.source], b = byId[e.target];
        return { a, b, faint: e.faint, rest: Math.hypot(a.x - b.x, a.y - b.y) };
      });
    alphaRef.current = 1;
    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesKey]);
  simRef.current = sim;

  // ---------- 물리 루프 ----------
  useEffect(() => {
    let raf;
    const PAD = 26;
    const tick = () => {
      const sim = simRef.current;
      if (sim) {
        const alpha = Math.max(alphaRef.current, 0.045); // 바닥값: 항상 은은하게 살아 움직임
        const { nodes, edges } = sim;

        // 반발력 (노드끼리 밀어냄)
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1; }
            const f = (2600 * alpha) / d2;
            const d = Math.sqrt(d2);
            const fx = (dx / d) * f, fy = (dy / d) * f;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }

        // 스프링 (간선이 당기고 밀며 출렁임)
        edges.forEach(({ a, b, rest }) => {
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(Math.hypot(dx, dy), 1);
          const f = 0.03 * (d - rest) * alpha * 10;
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        });

        // 중심으로 향하는 약한 중력 + 미세한 흔들림
        nodes.forEach(n => {
          const g = n.center ? 0.06 : 0.004;
          n.vx += (W / 2 - n.x) * g * alpha * 2;
          n.vy += (H / 2 - n.y) * g * alpha * 2;
          n.vx += (Math.random() - 0.5) * 0.35 * alpha;
          n.vy += (Math.random() - 0.5) * 0.35 * alpha;
        });

        // 적분 + 감쇠 + 경계
        nodes.forEach(n => {
          if (dragRef.current && dragRef.current.node === n) { n.vx = 0; n.vy = 0; return; }
          n.vx *= 0.86; n.vy *= 0.86;
          const cap = 6;
          n.vx = Math.max(-cap, Math.min(cap, n.vx));
          n.vy = Math.max(-cap, Math.min(cap, n.vy));
          n.x = Math.max(PAD, Math.min(W - PAD, n.x + n.vx));
          n.y = Math.max(PAD, Math.min(H - PAD - 12, n.y + n.vy));
        });

        alphaRef.current = dragRef.current ? 0.5 : alphaRef.current * 0.985;
        bump();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [W, H, nodesKey]);

  // ---------- 좌표 변환 & 드래그 ----------
  function toSvgPoint(clientX, clientY) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onPointerDown(node, e) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) {}
    const p = toSvgPoint(e.clientX, e.clientY);
    dragRef.current = { node, offsetX: node.x - p.x, offsetY: node.y - p.y, moved: 0 };
    alphaRef.current = 0.6;
  }

  function onPointerMove(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    const nx = p.x + drag.offsetX, ny = p.y + drag.offsetY;
    drag.moved += Math.hypot(nx - drag.node.x, ny - drag.node.y);
    drag.node.x = Math.max(20, Math.min(W - 20, nx));
    drag.node.y = Math.max(20, Math.min(H - 20, ny));
  }

  function onPointerUp(node) {
    const drag = dragRef.current;
    dragRef.current = null;
    alphaRef.current = 0.5;
    if (drag && drag.moved < 6 && node.link) onNavigate?.(node.link, node);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', display: 'block', touchAction: 'none', userSelect: 'none' }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => { dragRef.current = null; }}
    >
      {sim.edges.map((e, i) => (
        <line
          key={i}
          x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
          stroke="#9AA3AF" strokeWidth={e.faint ? 0.9 : 1.4} strokeOpacity={e.faint ? 0.35 : 0.5}
        />
      ))}
      {sim.nodes.map(node => {
        const isHover = hoverRef.current === node.id;
        return (
          <g
            key={node.id}
            onPointerDown={(e) => onPointerDown(node, e)}
            onPointerUp={() => onPointerUp(node)}
            onMouseEnter={() => { hoverRef.current = node.id; }}
            onMouseLeave={() => { hoverRef.current = null; }}
            style={{ cursor: node.link ? 'grab' : 'default' }}
          >
            <circle
              cx={node.x} cy={node.y}
              r={isHover ? node.r * 1.2 : node.r}
              fill={node.color}
              fillOpacity={node.leaf ? 0.8 : 0.95}
              style={{ filter: isHover ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
            />
            {node.center && (
              <circle cx={node.x} cy={node.y} r={node.r + 8} fill="none" stroke="#B9D4F2" strokeOpacity="0.5" strokeWidth="1.5" />
            )}
            <text
              x={node.x} y={node.y + node.r + (node.leaf ? 15 : 19)}
              textAnchor="middle"
              fill={isHover ? 'var(--color-primary)' : 'var(--color-ink)'}
              fontSize={node.center ? 16 : node.leaf ? 11.5 : 14}
              fontWeight={node.center ? 800 : node.leaf ? 500 : 700}
              style={{ pointerEvents: 'none' }}
            >
              {node.label}
            </text>
            {node.sub && (
              <text x={node.x} y={node.y + node.r + 29} textAnchor="middle" fill="var(--color-muted-ink)" fontSize="10.5" style={{ pointerEvents: 'none' }}>
                {node.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
