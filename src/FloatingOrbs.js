import { useEffect, useRef, useState, useCallback } from 'react';
import './FloatingOrbs.css';

/*
  3-Body Gravitational Simulation
  --------------------------------
  - Resize-aware: remaps body positions proportionally when viewport changes.
  - Writes live positions to orbPositionsRef for other components.
*/

const G = 500;
const MASS = 1;
const SOFTENING = 120;
const DAMPING = 0.9999;
const BOUNDARY_FORCE = 0.3;
const BOUNDARY_MARGIN = 80;
const DT = 0.5;
const MAX_SPEED = 3.5;

const CONDENSE_BASE = 400;
const CONDENSE_EXTRA = 300;
const EXPAND_DURATION = 500;
const DISPERSE_DURATION = 700;
const RECONVERGE_DURATION = 600;
const MIN_SCALE = 0.08;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clampSpeed(vx, vy) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed > MAX_SPEED) {
    return [(vx / speed) * MAX_SPEED, (vy / speed) * MAX_SPEED];
  }
  return [vx, vy];
}

function computeAccelerations(bodies, w, h) {
  const acc = bodies.map(() => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const distSq = dx * dx + dy * dy;
      const softSq = distSq + SOFTENING * SOFTENING;
      const inv = (G * MASS) / (softSq * Math.sqrt(softSq));
      const fx = inv * dx;
      const fy = inv * dy;
      acc[i].ax += fx; acc[i].ay += fy;
      acc[j].ax -= fx; acc[j].ay -= fy;
    }
  }
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.x < BOUNDARY_MARGIN) acc[i].ax += BOUNDARY_FORCE * (BOUNDARY_MARGIN - b.x);
    else if (b.x > w - BOUNDARY_MARGIN) acc[i].ax -= BOUNDARY_FORCE * (b.x - (w - BOUNDARY_MARGIN));
    if (b.y < BOUNDARY_MARGIN) acc[i].ay += BOUNDARY_FORCE * (BOUNDARY_MARGIN - b.y);
    else if (b.y > h - BOUNDARY_MARGIN) acc[i].ay -= BOUNDARY_FORCE * (b.y - (h - BOUNDARY_MARGIN));
  }
  return acc;
}

function initBodies(w, h) {
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) * 0.22;
  const baseAngle = Math.random() * Math.PI * 2;
  const positions = [0, 1, 2].map((i) => {
    const angle = baseAngle + (i * 2 * Math.PI) / 3;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const sideLength = radius * Math.sqrt(3);
  const orbitalSpeed = Math.sqrt((G * MASS) / sideLength) * 0.85;
  const jitterMag = orbitalSpeed * 0.15;
  const bodies = positions.map((pos) => {
    const dx = pos.x - cx, dy = pos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const tx = -dy / dist, ty = dx / dist;
    return {
      x: pos.x, y: pos.y,
      vx: tx * orbitalSpeed + (Math.random() - 0.5) * jitterMag,
      vy: ty * orbitalSpeed + (Math.random() - 0.5) * jitterMag,
    };
  });
  const avgVx = bodies.reduce((s, b) => s + b.vx, 0) / 3;
  const avgVy = bodies.reduce((s, b) => s + b.vy, 0) / 3;
  bodies.forEach((b) => { b.vx -= avgVx; b.vy -= avgVy; });
  return bodies;
}

const ORB_SIZES = [384, 320, 288];
const ORB_COLORS = [
  'rgba(229, 214, 148, 0.4)',
  'rgba(203, 174, 44, 0.4)',
  'rgba(255, 138, 94, 0.4)',
];

const FloatingOrbs = ({ condensing, dispersing, orbPositionsRef }) => {
  const bodiesRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const orbRefs = [useRef(null), useRef(null), useRef(null)];
  const [ready, setReady] = useState(false);

  const modeRef = useRef('physics');
  const animStartRef = useRef(0);
  const capturedRef = useRef(null);
  const perOrbDurRef = useRef([400, 400, 400]);
  const zElevateTimeRef = useRef(0);
  const prevSizeRef = useRef({ w: 0, h: 0 });

  const getViewport = useCallback(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }), []);

  useEffect(() => {
    const { w, h } = getViewport();
    bodiesRef.current = initBodies(w, h);
    prevSizeRef.current = { w, h };
    setReady(true);
  }, [getViewport]);

  useEffect(() => {
    if (!ready) return;
    const mode = modeRef.current;

    if (condensing && mode === 'physics') {
      const { w, h } = getViewport();
      const cx = w / 2, cy = h / 2;
      capturedRef.current = bodiesRef.current.map((b, i) => ({
        x: b.x, y: b.y, vx: b.vx, vy: b.vy, size: ORB_SIZES[i],
      }));
      const dists = capturedRef.current.map((c) =>
        Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2)
      );
      const maxDist = Math.max(...dists, 1);
      perOrbDurRef.current = dists.map((d) =>
        CONDENSE_BASE + (d / maxDist) * CONDENSE_EXTRA
      );
      animStartRef.current = performance.now();
      zElevateTimeRef.current = performance.now() + 100;
      modeRef.current = 'condensing';
    } else if (!condensing && (mode === 'condensed' || mode === 'condensing')) {
      animStartRef.current = performance.now();
      modeRef.current = dispersing ? 'dispersing' : 'expanding';
    }

    if (dispersing && mode === 'physics') {
      capturedRef.current = bodiesRef.current.map((b, i) => ({
        x: b.x, y: b.y, vx: b.vx, vy: b.vy, size: ORB_SIZES[i],
      }));
      animStartRef.current = performance.now();
      modeRef.current = 'dispersing';
    }

    if (!dispersing && mode === 'dispersed') {
      animStartRef.current = performance.now();
      modeRef.current = 'reconverging';
    }
  }, [condensing, dispersing, ready, getViewport]);

  useEffect(() => {
    if (!ready) return;

    const step = () => {
      const { w, h } = getViewport();
      const bodies = bodiesRef.current;
      const mode = modeRef.current;
      const container = containerRef.current;
      const prev = prevSizeRef.current;

      // --- Fix 1: Resize detection — remap positions proportionally ---
      if (prev.w > 0 && prev.h > 0 && (w !== prev.w || h !== prev.h)) {
        const ocx = prev.w / 2, ocy = prev.h / 2;
        const ncx = w / 2, ncy = h / 2;
        const sx = w / prev.w, sy = h / prev.h;
        for (let i = 0; i < 3; i++) {
          bodies[i].x = ncx + (bodies[i].x - ocx) * sx;
          bodies[i].y = ncy + (bodies[i].y - ocy) * sy;
        }
        if (capturedRef.current) {
          for (let i = 0; i < 3; i++) {
            const c = capturedRef.current[i];
            c.x = ncx + (c.x - ocx) * sx;
            c.y = ncy + (c.y - ocy) * sy;
          }
        }
        prevSizeRef.current = { w, h };
      } else if (w !== prev.w || h !== prev.h) {
        prevSizeRef.current = { w, h };
      }

      // --- Write live positions for the modal ---
      if (orbPositionsRef) {
        orbPositionsRef.current = bodies.map((b) => ({ x: b.x, y: b.y }));
      }

      if (mode === 'physics') {
        if (container) container.style.zIndex = '0';
        const acc = computeAccelerations(bodies, w, h);
        for (let i = 0; i < 3; i++) {
          bodies[i].vx += acc[i].ax * DT * 0.5;
          bodies[i].vy += acc[i].ay * DT * 0.5;
        }
        for (let i = 0; i < 3; i++) {
          bodies[i].x += bodies[i].vx * DT;
          bodies[i].y += bodies[i].vy * DT;
        }
        const acc2 = computeAccelerations(bodies, w, h);
        for (let i = 0; i < 3; i++) {
          bodies[i].vx += acc2[i].ax * DT * 0.5;
          bodies[i].vy += acc2[i].ay * DT * 0.5;
          bodies[i].vx *= DAMPING;
          bodies[i].vy *= DAMPING;
          [bodies[i].vx, bodies[i].vy] = clampSpeed(bodies[i].vx, bodies[i].vy);
        }
        for (let i = 0; i < 3; i++) {
          const el = orbRefs[i].current;
          if (el) {
            const s = ORB_SIZES[i];
            el.style.transform = `translate(${bodies[i].x - s / 2}px, ${bodies[i].y - s / 2}px) scale(1)`;
            el.style.opacity = '1';
          }
        }

      } else if (mode === 'condensing' || mode === 'condensed') {
        // Delay z-index elevation so backdrop starts darkening first
        const now = performance.now();
        if (container) container.style.zIndex = now >= zElevateTimeRef.current ? '95' : '0';
        const cx = w / 2, cy = h / 2;
        const elapsed = now - animStartRef.current;
        let allDone = true;
        for (let i = 0; i < 3; i++) {
          const cap = capturedRef.current[i];
          const dur = perOrbDurRef.current[i];
          const rawT = mode === 'condensed' ? 1 : Math.min(elapsed / dur, 1);
          if (rawT < 1) allDone = false;
          const t = easeOutCubic(rawT);
          const x = cap.x + (cx - cap.x) * t;
          const y = cap.y + (cy - cap.y) * t;
          const scale = 1 - t * (1 - MIN_SCALE);
          // Fade immediately from the start (no bright flash on first frames)
          const opacity = Math.max(0, 1 - t / 0.85);
          const el = orbRefs[i].current;
          if (el) {
            el.style.transform = `translate(${x - cap.size / 2}px, ${y - cap.size / 2}px) scale(${scale})`;
            el.style.opacity = String(opacity);
          }
        }
        if (allDone && mode === 'condensing') modeRef.current = 'condensed';

      } else if (mode === 'expanding') {
        if (container) container.style.zIndex = '95';
        const cx = w / 2, cy = h / 2;
        const elapsed = performance.now() - animStartRef.current;
        const rawT = Math.min(elapsed / EXPAND_DURATION, 1);
        const t = easeOutCubic(rawT);
        const scale = MIN_SCALE + t * (1 - MIN_SCALE);
        const opacity = Math.min(1, t / 0.4);
        for (let i = 0; i < 3; i++) {
          const cap = capturedRef.current[i];
          const x = cx + (cap.x - cx) * t;
          const y = cy + (cap.y - cy) * t;
          const el = orbRefs[i].current;
          if (el) {
            el.style.transform = `translate(${x - cap.size / 2}px, ${y - cap.size / 2}px) scale(${scale})`;
            el.style.opacity = String(opacity);
          }
        }
        if (rawT >= 1) {
          for (let i = 0; i < 3; i++) {
            const cap = capturedRef.current[i];
            bodies[i].x = cap.x; bodies[i].y = cap.y;
            bodies[i].vx = cap.vx; bodies[i].vy = cap.vy;
          }
          modeRef.current = 'physics';
        }

      } else if (mode === 'dispersing') {
        if (container) container.style.zIndex = '0';
        const cx = w / 2, cy = h / 2;
        const elapsed = performance.now() - animStartRef.current;
        const rawT = Math.min(elapsed / DISPERSE_DURATION, 1);
        const t = easeOutCubic(rawT);

        for (let i = 0; i < 3; i++) {
          const cap = capturedRef.current[i];
          const dx = cap.x - cx;
          const dy = cap.y - cy;
          const overshoot = 1.8;
          const x = cx + dx * overshoot * t;
          const y = cy + dy * overshoot * t;
          const scale = MIN_SCALE + (1.3 - MIN_SCALE) * t;
          const opacity = t < 0.2 ? (t / 0.2) * 0.5 : 0.5 * Math.max(0, 1 - (t - 0.2) / 0.8);
          const el = orbRefs[i].current;
          if (el) {
            el.style.transform = `translate(${x - cap.size / 2}px, ${y - cap.size / 2}px) scale(${scale})`;
            el.style.opacity = String(opacity);
          }
        }
        if (rawT >= 1) modeRef.current = 'dispersed';

      } else if (mode === 'dispersed') {
        if (container) container.style.zIndex = '0';
        for (let i = 0; i < 3; i++) {
          const el = orbRefs[i].current;
          if (el) el.style.opacity = '0';
        }

      } else if (mode === 'reconverging') {
        if (container) container.style.zIndex = '0';
        const cx = w / 2, cy = h / 2;
        const elapsed = performance.now() - animStartRef.current;
        const rawT = Math.min(elapsed / RECONVERGE_DURATION, 1);
        const t = easeOutCubic(rawT);

        for (let i = 0; i < 3; i++) {
          const cap = capturedRef.current[i];
          const dx = cap.x - cx;
          const dy = cap.y - cy;
          const overshoot = 1.8;
          const startX = cx + dx * overshoot;
          const startY = cy + dy * overshoot;
          const x = startX + (cap.x - startX) * t;
          const y = startY + (cap.y - startY) * t;
          const scale = 1.3 + (1 - 1.3) * t;
          const opacity = t;
          const el = orbRefs[i].current;
          if (el) {
            el.style.transform = `translate(${x - cap.size / 2}px, ${y - cap.size / 2}px) scale(${scale})`;
            el.style.opacity = String(opacity);
          }
        }
        if (rawT >= 1) {
          for (let i = 0; i < 3; i++) {
            const cap = capturedRef.current[i];
            bodies[i].x = cap.x; bodies[i].y = cap.y;
            bodies[i].vx = cap.vx; bodies[i].vy = cap.vy;
          }
          modeRef.current = 'physics';
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return null;

  return (
    <div ref={containerRef} className="floating-orbs-container">
      {ORB_SIZES.map((size, i) => (
        <div
          key={i}
          ref={orbRefs[i]}
          className="floating-orb"
          style={{
            width: size,
            height: size,
            backgroundColor: ORB_COLORS[i],
            top: 0,
            left: 0,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingOrbs;
