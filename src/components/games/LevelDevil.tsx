import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const W = 640;
const H = 360;
const PW = 22;
const PH = 26;
const GRAVITY = 0.7;
const MOVE = 3.4;
const JUMP_V = 12.5;

type Rect = { x: number; y: number; w: number; h: number };
type Trap =
  | { kind: "spike"; x: number; y: number; w: number; h: number }
  | { kind: "fall"; x: number; y: number; w: number; h: number; timer: number; gone: boolean }
  | {
      kind: "spikeUp";
      x: number;
      floorY: number;
      w: number;
      maxH: number;
      triggerX: number;
      rise: number;
      armed: boolean;
    }
  | {
      kind: "spikeDown";
      x: number;
      ceilY: number;
      w: number;
      maxH: number;
      triggerX: number;
      drop: number;
      armed: boolean;
    };

type Level = { start: { x: number; y: number }; door: Rect; platforms: Rect[]; traps: Trap[] };

function makeLevels(): Level[] {
  return [
    // Level 1 — the disappearing bridge + spike before the door
    {
      start: { x: 20, y: 300 },
      door: { x: 596, y: 288, w: 30, h: 42 },
      platforms: [
        { x: 0, y: 330, w: 250, h: 30 },
        { x: 390, y: 330, w: 250, h: 30 },
      ],
      traps: [
        { kind: "fall", x: 250, y: 330, w: 140, h: 30, timer: 16, gone: false },
        { kind: "spike", x: 250, y: 344, w: 140, h: 16 },
        { kind: "spikeUp", x: 520, floorY: 330, w: 26, maxH: 34, triggerX: 470, rise: 0, armed: false },
      ],
    },
    // Level 2 — ceiling spikes drop while you cross
    {
      start: { x: 20, y: 300 },
      door: { x: 596, y: 188, w: 30, h: 42 },
      platforms: [
        { x: 0, y: 330, w: 200, h: 30 },
        { x: 250, y: 330, w: 110, h: 30 },
        { x: 430, y: 270, w: 90, h: 20 },
        { x: 560, y: 230, w: 80, h: 20 },
      ],
      traps: [
        { kind: "spike", x: 200, y: 346, w: 50, h: 14 },
        { kind: "spike", x: 360, y: 346, w: 70, h: 14 },
        { kind: "spikeDown", x: 270, ceilY: 0, w: 26, maxH: 60, triggerX: 240, drop: 0, armed: false },
        { kind: "fall", x: 250, y: 330, w: 110, h: 30, timer: 22, gone: false },
        { kind: "spikeUp", x: 470, floorY: 290, w: 24, maxH: 28, triggerX: 425, rise: 0, armed: false },
      ],
    },
    // Level 3 — gauntlet
    {
      start: { x: 16, y: 300 },
      door: { x: 600, y: 108, w: 30, h: 42 },
      platforms: [
        { x: 0, y: 330, w: 150, h: 30 },
        { x: 210, y: 300, w: 80, h: 18 },
        { x: 340, y: 250, w: 80, h: 18 },
        { x: 470, y: 200, w: 80, h: 18 },
        { x: 560, y: 150, w: 80, h: 18 },
      ],
      traps: [
        { kind: "spike", x: 150, y: 346, w: 490, h: 14 },
        { kind: "fall", x: 210, y: 300, w: 80, h: 18, timer: 14, gone: false },
        { kind: "spikeUp", x: 380, floorY: 250, w: 22, maxH: 26, triggerX: 345, rise: 0, armed: false },
        { kind: "spikeDown", x: 500, ceilY: 70, w: 24, maxH: 50, triggerX: 470, drop: 0, armed: false },
      ],
    },
  ];
}

function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const LevelDevil = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [levelIdx, setLevelIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "playing" | "dead" | "won">("idle");
  const [deaths, setDeaths] = useState(0);

  const s = useRef({
    level: null as Level | null,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    onGround: false,
    left: false,
    right: false,
    flash: 0,
    idx: 0,
  });

  const loadLevel = (idx: number) => {
    const lvl: Level = JSON.parse(JSON.stringify(makeLevels()[idx]));
    s.current.level = lvl;
    s.current.px = lvl.start.x;
    s.current.py = lvl.start.y;
    s.current.vx = 0;
    s.current.vy = 0;
    s.current.onGround = false;
    s.current.idx = idx;
  };

  const start = (idx = 0) => {
    setLevelIdx(idx);
    loadLevel(idx);
    setStatus("playing");
    setRunning(true);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const st = s.current;
      if (["ArrowLeft", "KeyA"].includes(e.code)) st.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) st.right = true;
      if (["ArrowUp", "KeyW", "Space"].includes(e.code)) {
        e.preventDefault();
        if (running && st.onGround) {
          st.vy = -JUMP_V;
          st.onGround = false;
        } else if (!running) start(levelIdx);
      }
    };
    const up = (e: KeyboardEvent) => {
      const st = s.current;
      if (["ArrowLeft", "KeyA"].includes(e.code)) st.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) st.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [running, levelIdx]);

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    let raf = 0;

    const die = () => {
      setDeaths((d) => d + 1);
      setRunning(false);
      setStatus("dead");
    };

    const solidRects = (lvl: Level): Rect[] => {
      const rects = [...lvl.platforms];
      for (const t of lvl.traps) if (t.kind === "fall" && !t.gone) rects.push({ x: t.x, y: t.y, w: t.w, h: t.h });
      return rects;
    };

    const lethalRects = (lvl: Level): Rect[] => {
      const rects: Rect[] = [];
      for (const t of lvl.traps) {
        if (t.kind === "spike") rects.push({ x: t.x, y: t.y, w: t.w, h: t.h });
        if (t.kind === "spikeUp" && t.rise > 4)
          rects.push({ x: t.x, y: t.floorY - t.rise, w: t.w, h: t.rise });
        if (t.kind === "spikeDown" && t.drop > 4)
          rects.push({ x: t.x, y: t.ceilY, w: t.w, h: t.drop });
      }
      return rects;
    };

    const loop = () => {
      const st = s.current;
      const lvl = st.level!;

      // input -> velocity
      st.vx = (st.right ? MOVE : 0) - (st.left ? MOVE : 0);

      const solids = solidRects(lvl);

      // horizontal
      st.px += st.vx;
      const ph: Rect = { x: st.px, y: st.py, w: PW, h: PH };
      for (const r of solids) {
        if (overlap(ph, r)) {
          if (st.vx > 0) st.px = r.x - PW;
          else if (st.vx < 0) st.px = r.x + r.w;
          ph.x = st.px;
        }
      }
      st.px = Math.max(0, Math.min(W - PW, st.px));

      // vertical
      st.vy += GRAVITY;
      st.py += st.vy;
      const pv: Rect = { x: st.px, y: st.py, w: PW, h: PH };
      st.onGround = false;
      let standingFall: Trap | null = null;
      for (const r of solids) {
        if (overlap(pv, r)) {
          if (st.vy > 0) {
            st.py = r.y - PH;
            st.vy = 0;
            st.onGround = true;
            // is this a fall trap?
            const ft = lvl.traps.find(
              (t) => t.kind === "fall" && !t.gone && t.x === r.x && t.y === r.y,
            );
            if (ft) standingFall = ft;
          } else if (st.vy < 0) {
            st.py = r.y + r.h;
            st.vy = 0;
          }
          pv.y = st.py;
        }
      }

      // arm traps
      for (const t of lvl.traps) {
        if (t.kind === "fall" && standingFall === t) {
          t.timer -= 1;
          if (t.timer <= 0) t.gone = true;
        }
        if (t.kind === "spikeUp") {
          if (!t.armed && st.px + PW > t.triggerX) t.armed = true;
          if (t.armed && t.rise < t.maxH) t.rise = Math.min(t.maxH, t.rise + 4);
        }
        if (t.kind === "spikeDown") {
          if (!t.armed && st.px + PW > t.triggerX) t.armed = true;
          if (t.armed && t.drop < t.maxH) t.drop = Math.min(t.maxH, t.drop + 5);
        }
      }

      // death checks
      const pbox: Rect = { x: st.px, y: st.py, w: PW, h: PH };
      if (st.py > H + 10) return die();
      for (const r of lethalRects(lvl)) if (overlap(pbox, r)) return die();

      // win check
      if (overlap(pbox, lvl.door)) {
        if (st.idx + 1 >= makeLevels().length) {
          setRunning(false);
          setStatus("won");
          return;
        } else {
          loadLevel(st.idx + 1);
          setLevelIdx(st.idx + 1);
        }
      }

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#160a0a");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // platforms
      for (const r of lvl.platforms) {
        ctx.fillStyle = "#3a2a12";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = "#e2b44b";
        ctx.fillRect(r.x, r.y, r.w, 3);
      }
      // fall traps (cracked look) — drawn only if not gone
      for (const t of lvl.traps) {
        if (t.kind === "fall" && !t.gone) {
          ctx.fillStyle = t.timer < 16 ? "#5a3a16" : "#46330f";
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.strokeStyle = "#e2b44b";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(t.x + t.w * 0.3, t.y);
          ctx.lineTo(t.x + t.w * 0.45, t.y + t.h);
          ctx.moveTo(t.x + t.w * 0.6, t.y);
          ctx.lineTo(t.x + t.w * 0.5, t.y + t.h);
          ctx.stroke();
        }
      }
      // spikes
      const drawSpikeRow = (x: number, y: number, w: number, h: number, dir: 1 | -1) => {
        ctx.fillStyle = "#f5d784";
        const n = Math.max(1, Math.floor(w / 14));
        const sw = w / n;
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          if (dir === 1) {
            ctx.moveTo(x + i * sw, y + h);
            ctx.lineTo(x + i * sw + sw / 2, y);
            ctx.lineTo(x + (i + 1) * sw, y + h);
          } else {
            ctx.moveTo(x + i * sw, y);
            ctx.lineTo(x + i * sw + sw / 2, y + h);
            ctx.lineTo(x + (i + 1) * sw, y);
          }
          ctx.closePath();
          ctx.fill();
        }
      };
      for (const t of lvl.traps) {
        if (t.kind === "spike") drawSpikeRow(t.x, t.y, t.w, t.h, 1);
        if (t.kind === "spikeUp" && t.rise > 0) drawSpikeRow(t.x, t.floorY - t.rise, t.w, t.rise, 1);
        if (t.kind === "spikeDown" && t.drop > 0) drawSpikeRow(t.x, t.ceilY, t.w, t.drop, -1);
      }

      // door
      ctx.fillStyle = "#7a1f1f";
      ctx.fillRect(lvl.door.x, lvl.door.y, lvl.door.w, lvl.door.h);
      ctx.strokeStyle = "#f5d784";
      ctx.lineWidth = 2;
      ctx.strokeRect(lvl.door.x, lvl.door.y, lvl.door.w, lvl.door.h);
      ctx.fillStyle = "#f5d784";
      ctx.beginPath();
      ctx.arc(lvl.door.x + lvl.door.w - 7, lvl.door.y + lvl.door.h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // player
      const grad = ctx.createLinearGradient(st.px, st.py, st.px, st.py + PH);
      grad.addColorStop(0, "#f5d784");
      grad.addColorStop(1, "#c9952f");
      ctx.fillStyle = grad;
      ctx.fillRect(st.px, st.py, PW, PH);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(st.px + 5, st.py + 7, 3, 3);
      ctx.fillRect(st.px + PW - 8, st.py + 7, 3, 3);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[640px] items-center justify-between font-display text-sm text-accent">
        <span>Level {levelIdx + 1} / 3</span>
        <span>Deaths: {deaths}</span>
      </div>
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-md border border-border/60 bg-black">
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 text-center">
            <p className="font-display text-xl text-gold-gradient text-glow">
              {status === "won"
                ? "🏆 You escaped the devil!"
                : status === "dead"
                  ? "💀 The devil got you"
                  : "Level Devil"}
            </p>
            <p className="max-w-[380px] text-sm text-muted-foreground">
              Reach the door. But beware — the floor lies, spikes pop up, and the ceiling bites. Move
              with ← →, jump with ↑ / Space.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => start(status === "won" ? 0 : levelIdx)}
                variant="outline"
                className="border-primary/60 text-accent"
              >
                {status === "dead" ? "Retry" : status === "won" ? "Play again" : "Start"}
              </Button>
              {status !== "won" && levelIdx > 0 && (
                <Button onClick={() => start(0)} variant="ghost" className="text-muted-foreground">
                  Restart
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelDevil;
