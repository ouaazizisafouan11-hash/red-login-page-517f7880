import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const W = 360;
const H = 460;
const PLAYER_W = 34;
const PLAYER_H = 34;

type Faller = { x: number; y: number; r: number; vy: number; spin: number; a: number };

const DevilGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const state = useRef({
    px: W / 2 - PLAYER_W / 2,
    left: false,
    right: false,
    pointerX: null as number | null,
    fallers: [] as Faller[],
    spawn: 0,
    t: 0,
    speed: 2.2,
    alive: true,
  });

  const start = () => {
    state.current = {
      px: W / 2 - PLAYER_W / 2,
      left: false,
      right: false,
      pointerX: null,
      fallers: [],
      spawn: 0,
      t: 0,
      speed: 2.2,
      alive: true,
    };
    setScore(0);
    setDead(false);
    setRunning(true);
  };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") state.current.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") state.current.right = true;
      if ((e.code === "Space" || e.code === "Enter") && !running) start();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") state.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") state.current.right = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const loop = () => {
      const s = state.current;
      if (!s.alive) return;
      s.t += 1;

      // movement
      const speed = 6;
      if (s.pointerX != null) {
        const target = s.pointerX - PLAYER_W / 2;
        s.px += (target - s.px) * 0.35;
      } else {
        if (s.left) s.px -= speed;
        if (s.right) s.px += speed;
      }
      s.px = Math.max(0, Math.min(W - PLAYER_W, s.px));

      // spawn devils
      s.spawn -= 1;
      if (s.spawn <= 0) {
        const r = 12 + Math.random() * 10;
        s.fallers.push({
          x: r + Math.random() * (W - 2 * r),
          y: -r,
          r,
          vy: s.speed + Math.random() * 1.6,
          spin: 0,
          a: Math.random() * Math.PI,
        });
        s.spawn = Math.max(14, 42 - s.t * 0.02);
      }
      s.speed += 0.0018;

      // update fallers + collide
      const pcx = s.px + PLAYER_W / 2;
      const pcy = H - 40 + PLAYER_H / 2;
      for (const f of s.fallers) {
        f.y += f.vy;
        f.spin += 0.15;
      }
      s.fallers = s.fallers.filter((f) => f.y - f.r < H + 20);
      for (const f of s.fallers) {
        const dx = f.x - pcx;
        const dy = f.y - pcy;
        if (Math.hypot(dx, dy) < f.r + PLAYER_W / 2 - 4) {
          s.alive = false;
        }
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      // subtle vignette
      const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H);
      bg.addColorStop(0, "rgba(40,20,0,0.4)");
      bg.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // devils (fireballs)
      for (const f of s.fallers) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.spin);
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, f.r);
        g.addColorStop(0, "#fff0c0");
        g.addColorStop(0.5, "#e2b44b");
        g.addColorStop(1, "#7a1f1f");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, f.r, 0, Math.PI * 2);
        ctx.fill();
        // tiny horns
        ctx.fillStyle = "#3a0d0d";
        ctx.beginPath();
        ctx.moveTo(-f.r * 0.6, -f.r * 0.5);
        ctx.lineTo(-f.r * 0.3, -f.r * 1.1);
        ctx.lineTo(-f.r * 0.1, -f.r * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(f.r * 0.6, -f.r * 0.5);
        ctx.lineTo(f.r * 0.3, -f.r * 1.1);
        ctx.lineTo(f.r * 0.1, -f.r * 0.5);
        ctx.fill();
        ctx.restore();
      }

      // player (golden soul)
      ctx.save();
      ctx.translate(s.px + PLAYER_W / 2, H - 40 + PLAYER_H / 2);
      const pg = ctx.createLinearGradient(-PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W / 2, PLAYER_H / 2);
      pg.addColorStop(0, "#f5d784");
      pg.addColorStop(1, "#c9952f");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_W / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff6df";
      ctx.lineWidth = 2;
      ctx.stroke();
      // eyes
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      setScore(Math.floor(s.t / 6));

      if (s.alive) raf = requestAnimationFrame(loop);
      else {
        const final = Math.floor(s.t / 6);
        setBest((b) => Math.max(b, final));
        setRunning(false);
        setDead(true);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const handlePointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    state.current.pointerX = x;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[360px] items-center justify-between font-display text-sm text-accent">
        <span>Time: {score}</span>
        <span>Best: {best}</span>
      </div>
      <div
        className="relative overflow-hidden rounded-md border border-border/60 bg-black/70"
        onMouseMove={(e) => running && handlePointer(e.clientX)}
        onMouseLeave={() => (state.current.pointerX = null)}
        onTouchMove={(e) => running && handlePointer(e.touches[0].clientX)}
        onClick={() => !running && start()}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full max-w-[360px] touch-none" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
            <p className="font-display text-xl text-gold-gradient text-glow">
              {dead ? "🔥 Caught by the devil" : "Live the Devil"}
            </p>
            <p className="max-w-[260px] text-sm text-muted-foreground">
              Move with ← → arrows or your mouse and survive the falling devils.
            </p>
            <Button variant="outline" className="border-primary/60 text-accent">
              {dead ? "Try again" : "Start"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevilGame;
