import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899", "#fbbf24"];

const DURATION = 5000; // total celebration length (ms)
const EMIT_UNTIL = 3400; // stop launching new confetti after this, let it settle

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
  shape: number;
  life: number;
  maxLife: number;
}

interface ConfettiBurstProps {
  customerName?: string;
  crName?: string;
  carModel?: string;
  onDone?: () => void;
}

/**
 * A self-contained, dependency-free 5-second confetti celebration with corner
 * "cannons" and a named banner. Mount it to fire; it calls `onDone` when
 * finished. Respects prefers-reduced-motion (shows the banner, skips particles).
 */
export function ConfettiBurst({ customerName, crName, carModel, onDone }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (reduce || !canvas || !ctx) {
      const t = setTimeout(() => onDoneRef.current?.(), DURATION);
      return () => clearTimeout(t);
    }

    const dpr = window.devicePixelRatio || 1;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];

    const spawn = (cx: number, cy: number, aMin: number, aMax: number, sMin: number, sMax: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const angle = aMin + Math.random() * (aMax - aMin);
        const speed = sMin + Math.random() * (sMax - sMin);
        const maxLife = 90 + Math.random() * 70;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 7,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.4,
          shape: (Math.random() * 3) | 0,
          life: maxLife,
          maxLife,
        });
      }
    };

    // Opening triple-burst: center fountain + both corner cannons.
    const openingBurst = () => {
      spawn(W * 0.5, H * 0.42, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5, 9, 17, 110);
      spawn(4, H - 4, -Math.PI / 3, -Math.PI / 12, 13, 22, 70); // bottom-left → up-right
      spawn(W - 4, H - 4, Math.PI + Math.PI / 12, Math.PI + Math.PI / 3, 13, 22, 70); // bottom-right → up-left
    };

    const gravity = 0.22;
    const start = performance.now();
    let lastEmit = 0;
    let raf = 0;

    openingBurst();

    const frame = (now: number) => {
      const elapsed = now - start;

      // Periodic corner puffs while still emitting.
      if (elapsed < EMIT_UNTIL && now - lastEmit > 550) {
        lastEmit = now;
        const leftSide = Math.random() < 0.5;
        if (leftSide) spawn(4, H - 4, -Math.PI / 3, -Math.PI / 12, 12, 20, 34);
        else spawn(W - 4, H - 4, Math.PI + Math.PI / 12, Math.PI + Math.PI / 3, 12, 20, 34);
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life--;
        if (p.life <= 0 || p.y - p.size > H) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        else if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < DURATION || particles.length > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        onDoneRef.current?.();
      }
    };
    raf = requestAnimationFrame(frame);

    // Hard stop so the celebration never outstays its welcome.
    const stop = setTimeout(() => onDoneRef.current?.(), DURATION + 400);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(stop);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const headline = crName ? `${crName} won the deal!` : "Deal won!";
  const sub = [customerName, carModel].filter(Boolean).join(" · ");

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="absolute left-1/2 top-[34%] w-[min(90vw,26rem)] -translate-x-1/2"
      >
        <div className="flex items-center gap-4 rounded-3xl border border-white/20 bg-primary-700 px-6 py-5 text-white shadow-2xl shadow-primary-950/50">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
            <motion.span
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: [0, -12, 12, 0], scale: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <Trophy size={28} className="text-amber-300" />
            </motion.span>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-200">Retail</p>
            <h2 className="truncate text-xl font-extrabold leading-tight">{headline}</h2>
            {sub && <p className="mt-0.5 truncate text-sm font-medium text-primary-100">{sub}</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
