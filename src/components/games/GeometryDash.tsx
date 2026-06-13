import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const W = 600;
const H = 240;
const GROUND = 200;
const GRAVITY = 0.9;
const JUMP = -13;

type Obstacle = { x: number; w: number; h: number };

const GeometryDash = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [dead, setDead] = useState(false);

  // Mutable game state kept in refs to avoid re-renders inside the loop
  const stateRef = useRef({
    y: GROUND,
    vy: 0,
    rot: 0,
    obstacles: [] as Obstacle[],
    speed: 5,
    spawn: 0,
    score: 0,
    alive: true,
  });

  const jump = () => {
    const s = stateRef.current;
    if (!running) return;
    if (s.y >= GROUND - 0.5) {
      s.vy = JUMP;
    }
  };

  const start = () => {
    stateRef.current = {
      y: GROUND,
      vy: 0,
      rot: 0,
      obstacles: [],
      speed: 5,
      spawn: 0,
      score: 0,
      alive: true,
    };
    setScore(0);
    setDead(false);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const gold = "#e2b44b";
    const goldLight = "#f5d784";

    const loop = () => {
      const s = stateRef.current;
      if (!s.alive) return;

      // physics
      s.vy += GRAVITY;
      s.y += s.vy;
      if (s.y > GROUND) {
        s.y = GROUND;
        s.vy = 0;
      }
      s.rot += 0.18;

      // spawn obstacles
      s.spawn -= 1;
      if (s.spawn <= 0) {
        const h = 24 + Math.random() * 26;
        s.obstacles.push({ x: W + 20, w: 22, h });
        s.spawn = 60 + Math.random() * 50;
      }
      s.speed += 0.0015;

      // move + collide
      const px = 70;
      const psize = 26;
      for (const o of s.obstacles) o.x -= s.speed;
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -10);

      for (const o of s.obstacles) {
        const oy = GROUND + psize / 2 - o.h;
        const hit =
          px + psize / 2 > o.x &&
          px - psize / 2 < o.x + o.w &&
          s.y + psize / 2 > oy;
        if (hit) {
          s.alive = false;
        }
      }

      s.score += 1;

      // draw
      ctx.clearRect(0, 0, W, H);
      // bg grid
      ctx.strokeStyle = "rgba(226,180,75,0.08)";
      ctx.lineWidth = 1;
      for (let x = (s.score * 2) % 40; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      // ground
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + psize / 2);
      ctx.lineTo(W, GROUND + psize / 2);
      ctx.stroke();

      // obstacles (gold spikes)
      ctx.fillStyle = goldLight;
      for (const o of s.obstacles) {
        const baseY = GROUND + psize / 2;
        ctx.beginPath();
        ctx.moveTo(o.x, baseY);
        ctx.lineTo(o.x + o.w / 2, baseY - o.h);
        ctx.lineTo(o.x + o.w, baseY);
        ctx.closePath();
        ctx.fill();
      }

      // player cube
      ctx.save();
      ctx.translate(px, s.y);
      ctx.rotate(s.rot);
      const grad = ctx.createLinearGradient(-13, -13, 13, 13);
      grad.addColorStop(0, goldLight);
      grad.addColorStop(1, gold);
      ctx.fillStyle = grad;
      ctx.fillRect(-13, -13, 26, 26);
      ctx.strokeStyle = "#fff6df";
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -13, 26, 26);
      ctx.restore();

      setScore(Math.floor(s.score / 5));

      if (s.alive) {
        raf = requestAnimationFrame(loop);
      } else {
        const final = Math.floor(s.score / 5);
        setBest((b) => Math.max(b, final));
        setRunning(false);
        setDead(true);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (running) jump();
        else start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[600px] items-center justify-between font-display text-sm text-accent">
        <span>Score: {score}</span>
        <span>Best: {best}</span>
      </div>
      <div
        className="relative w-full max-w-[600px] cursor-pointer overflow-hidden rounded-md border border-border/60 bg-black/60"
        onClick={() => (running ? jump() : start())}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-center">
            <p className="font-display text-xl text-gold-gradient text-glow">
              {dead ? "💥 Game over" : "Geometry Dash"}
            </p>
            <p className="text-sm text-muted-foreground">Tap / Space to jump over the spikes</p>
            <Button variant="outline" className="border-primary/60 text-accent">
              {dead ? "Try again" : "Start"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryDash;
