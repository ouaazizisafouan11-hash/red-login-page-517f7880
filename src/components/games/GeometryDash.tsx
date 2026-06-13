import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const W = 640;
const H = 300;
const GROUND_Y = 260; // player bottom rests here (normal gravity)
const CEIL_Y = 40; // player top rests here (flipped gravity)
const SIZE = 26;
const SCREEN_X = 90; // fixed player x on screen
const SPEED = 4.2;
const GRAVITY = 0.9;
const JUMP_V = 13;

type Obstacle =
  | { type: "spike"; x: number; surface: "floor" | "ceil" }
  | { type: "block"; x: number; w: number; h: number; surface: "floor" | "ceil" }
  | { type: "portalShip"; x: number }
  | { type: "portalCube"; x: number }
  | { type: "portalGravity"; x: number }
  | { type: "pillar"; x: number; w: number; gapTop: number; gapH: number }
  | { type: "finish"; x: number };

// Hand-authored "stages" with a cube section, a ship section, and a gravity flip.
function buildLevel(): { obstacles: Obstacle[]; length: number } {
  const o: Obstacle[] = [];
  const spike = (x: number, surface: "floor" | "ceil" = "floor") =>
    o.push({ type: "spike", x, surface });

  // --- Cube stage 1: simple spikes ---
  spike(520);
  spike(700);
  spike(880);
  spike(910); // double
  o.push({ type: "block", x: 1050, w: 40, h: 40, surface: "floor" });
  spike(1090);
  spike(1300);
  spike(1330);
  spike(1360); // triple
  spike(1560);

  // --- Ship stage ---
  o.push({ type: "portalShip", x: 1750 });
  o.push({ type: "pillar", x: 1950, w: 34, gapTop: 120, gapH: 120 });
  o.push({ type: "pillar", x: 2200, w: 34, gapTop: 60, gapH: 120 });
  o.push({ type: "pillar", x: 2450, w: 34, gapTop: 150, gapH: 110 });
  o.push({ type: "pillar", x: 2700, w: 34, gapTop: 90, gapH: 120 });
  o.push({ type: "portalCube", x: 2920 });

  // --- Cube stage 2 with gravity flip ---
  spike(3120);
  o.push({ type: "portalGravity", x: 3280 }); // flip to ceiling
  spike(3450, "ceil");
  spike(3620, "ceil");
  spike(3650, "ceil");
  o.push({ type: "portalGravity", x: 3820 }); // flip back to floor
  spike(4000);
  spike(4030);
  spike(4220);
  spike(4400);

  o.push({ type: "finish", x: 4650 });
  return { obstacles: o, length: 4650 };
}

const GeometryDash = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [won, setWon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [best, setBest] = useState(0);

  const s = useRef({
    camX: 0,
    y: GROUND_Y - SIZE,
    vy: 0,
    rot: 0,
    grav: 1 as 1 | -1,
    mode: "cube" as "cube" | "ship",
    hold: false,
    obstacles: [] as Obstacle[],
    length: 0,
    alive: true,
    finished: false,
  });

  const start = () => {
    const lvl = buildLevel();
    s.current = {
      camX: 0,
      y: GROUND_Y - SIZE,
      vy: 0,
      rot: 0,
      grav: 1,
      mode: "cube",
      hold: false,
      obstacles: lvl.obstacles,
      length: lvl.length,
      alive: true,
      finished: false,
    };
    setProgress(0);
    setDead(false);
    setWon(false);
    setRunning(true);
  };

  const onGround = () => {
    const st = s.current;
    if (st.grav === 1) return st.y >= GROUND_Y - SIZE - 0.5;
    return st.y <= CEIL_Y + 0.5;
  };

  const press = () => {
    const st = s.current;
    if (!running) return;
    st.hold = true;
    if (st.mode === "cube" && onGround()) {
      st.vy = -JUMP_V * st.grav;
    }
  };
  const release = () => {
    s.current.hold = false;
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (running) press();
        else start();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    let raf = 0;

    const die = () => {
      const st = s.current;
      st.alive = false;
      setBest((b) => Math.max(b, Math.floor((st.camX / st.length) * 100)));
      setRunning(false);
      setDead(true);
    };

    const loop = () => {
      const st = s.current;
      if (!st.alive) return;

      st.camX += SPEED;
      const worldX = st.camX + SCREEN_X;

      // physics
      if (st.mode === "cube") {
        st.vy += GRAVITY * st.grav;
        st.y += st.vy;
        st.rot += 0.16;
        if (st.grav === 1 && st.y > GROUND_Y - SIZE) {
          st.y = GROUND_Y - SIZE;
          st.vy = 0;
          st.rot = Math.round(st.rot / (Math.PI / 2)) * (Math.PI / 2);
        }
        if (st.grav === -1 && st.y < CEIL_Y) {
          st.y = CEIL_Y;
          st.vy = 0;
          st.rot = Math.round(st.rot / (Math.PI / 2)) * (Math.PI / 2);
        }
      } else {
        // ship: hold to rise
        st.vy += (st.hold ? -0.55 : 0.55);
        st.vy = Math.max(-7, Math.min(7, st.vy));
        st.y += st.vy;
        if (st.y < CEIL_Y) {
          st.y = CEIL_Y;
          st.vy = 0;
        }
        if (st.y > GROUND_Y - SIZE) {
          st.y = GROUND_Y - SIZE;
          st.vy = 0;
        }
      }

      // portals + collisions
      const pTop = st.y;
      const pBot = st.y + SIZE;
      for (const ob of st.obstacles) {
        const within = worldX + SIZE / 2 > ob.x && worldX - SIZE / 2 < ob.x + ("w" in ob ? ob.w : 24);
        switch (ob.type) {
          case "portalShip":
            if (Math.abs(ob.x - worldX) < SPEED) st.mode = "ship";
            break;
          case "portalCube":
            if (Math.abs(ob.x - worldX) < SPEED) {
              st.mode = "cube";
              st.vy = 0;
            }
            break;
          case "portalGravity":
            if (Math.abs(ob.x - worldX) < SPEED) {
              st.grav = st.grav === 1 ? -1 : 1;
              st.vy = 0;
            }
            break;
          case "spike": {
            const baseY = ob.surface === "floor" ? GROUND_Y : CEIL_Y;
            const top = ob.surface === "floor" ? baseY - 26 : baseY;
            const bot = ob.surface === "floor" ? baseY : baseY + 26;
            if (within && pBot > top + 4 && pTop < bot - 4) die();
            break;
          }
          case "block": {
            const baseY = ob.surface === "floor" ? GROUND_Y : CEIL_Y;
            const top = ob.surface === "floor" ? baseY - ob.h : baseY;
            const bot = ob.surface === "floor" ? baseY : baseY + ob.h;
            if (within && pBot > top && pTop < bot) {
              // allow landing on top when falling
              if (st.grav === 1 && st.vy >= 0 && pBot - st.vy <= top + 6) {
                st.y = top - SIZE;
                st.vy = 0;
              } else {
                die();
              }
            }
            break;
          }
          case "pillar": {
            if (within) {
              if (pTop < ob.gapTop || pBot > ob.gapTop + ob.gapH) die();
            }
            break;
          }
          case "finish":
            if (worldX >= ob.x) {
              st.finished = true;
              st.alive = false;
            }
            break;
        }
        if (!st.alive) break;
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, st.mode === "ship" ? "#1a1206" : "#0a0a0a");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // moving grid
      ctx.strokeStyle = "rgba(226,180,75,0.08)";
      ctx.lineWidth = 1;
      for (let x = -(st.camX % 40); x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // floor & ceiling
      ctx.strokeStyle = "#e2b44b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.moveTo(0, CEIL_Y);
      ctx.lineTo(W, CEIL_Y);
      ctx.stroke();

      // obstacles
      for (const ob of st.obstacles) {
        const sx = ob.x - st.camX;
        if (sx < -60 || sx > W + 60) continue;
        if (ob.type === "spike") {
          const baseY = ob.surface === "floor" ? GROUND_Y : CEIL_Y;
          ctx.fillStyle = "#f5d784";
          ctx.beginPath();
          if (ob.surface === "floor") {
            ctx.moveTo(sx - 12, baseY);
            ctx.lineTo(sx, baseY - 26);
            ctx.lineTo(sx + 12, baseY);
          } else {
            ctx.moveTo(sx - 12, baseY);
            ctx.lineTo(sx, baseY + 26);
            ctx.lineTo(sx + 12, baseY);
          }
          ctx.closePath();
          ctx.fill();
        } else if (ob.type === "block") {
          const baseY = ob.surface === "floor" ? GROUND_Y : CEIL_Y;
          const top = ob.surface === "floor" ? baseY - ob.h : baseY;
          ctx.fillStyle = "#c9952f";
          ctx.fillRect(sx, top, ob.w, ob.h);
          ctx.strokeStyle = "#fff6df";
          ctx.strokeRect(sx, top, ob.w, ob.h);
        } else if (ob.type === "pillar") {
          ctx.fillStyle = "#7a1f1f";
          ctx.fillRect(sx, CEIL_Y, ob.w, ob.gapTop - CEIL_Y);
          ctx.fillRect(sx, ob.gapTop + ob.gapH, ob.w, GROUND_Y - (ob.gapTop + ob.gapH));
        } else if (ob.type === "portalShip" || ob.type === "portalCube") {
          ctx.strokeStyle = ob.type === "portalShip" ? "#4ea3e2" : "#7ee24e";
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - 8, CEIL_Y, 16, GROUND_Y - CEIL_Y);
        } else if (ob.type === "portalGravity") {
          ctx.strokeStyle = "#e24ea3";
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - 8, CEIL_Y, 16, GROUND_Y - CEIL_Y);
        } else if (ob.type === "finish") {
          ctx.fillStyle = "#f5d784";
          for (let r = 0; r < 8; r++)
            for (let c = 0; c < 2; c++)
              if ((r + c) % 2 === 0) ctx.fillRect(sx + c * 12, CEIL_Y + r * 28, 12, 28);
        }
      }

      // player cube / ship
      ctx.save();
      ctx.translate(SCREEN_X, st.y + SIZE / 2);
      if (st.mode === "cube") ctx.rotate(st.rot);
      const grad = ctx.createLinearGradient(-13, -13, 13, 13);
      grad.addColorStop(0, "#f5d784");
      grad.addColorStop(1, "#c9952f");
      ctx.fillStyle = grad;
      if (st.mode === "ship") {
        ctx.beginPath();
        ctx.moveTo(-14, -10);
        ctx.lineTo(16, 0);
        ctx.lineTo(-14, 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-13, -13, 26, 26);
        ctx.strokeStyle = "#fff6df";
        ctx.lineWidth = 2;
        ctx.strokeRect(-13, -13, 26, 26);
      }
      ctx.restore();

      setProgress(Math.min(100, Math.floor((st.camX / st.length) * 100)));

      if (st.alive) raf = requestAnimationFrame(loop);
      else if (st.finished) {
        setBest((b) => Math.max(b, 100));
        setRunning(false);
        setWon(true);
        setProgress(100);
      } else {
        die();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[640px] items-center gap-3 font-display text-sm text-accent">
        <span className="w-12">{progress}%</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-16 text-right">Best {best}%</span>
      </div>
      <div
        className="relative w-full max-w-[640px] cursor-pointer select-none overflow-hidden rounded-md border border-border/60 bg-black"
        onMouseDown={() => (running ? press() : start())}
        onMouseUp={release}
        onTouchStart={(e) => {
          e.preventDefault();
          running ? press() : start();
        }}
        onTouchEnd={release}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
            <p className="font-display text-xl text-gold-gradient text-glow">
              {won ? "🏆 Level complete!" : dead ? `💥 You died at ${progress}%` : "Geometry Dash"}
            </p>
            <p className="max-w-[360px] text-sm text-muted-foreground">
              Hold Space / tap to jump (cube) or fly (ship). Watch for ship portals, gravity flips and
              spikes. Reach the checkered finish!
            </p>
            <Button variant="outline" className="border-primary/60 text-accent">
              {dead || won ? "Try again" : "Start"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeometryDash;
