import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Cell = "X" | "O" | null;
type Mode = "friend" | "ai";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(b: Cell[]): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
  }
  return null;
}

function minimax(b: Cell[], isMax: boolean): number {
  const w = winnerOf(b);
  if (w?.player === "O") return 10;
  if (w?.player === "X") return -10;
  if (b.every(Boolean)) return 0;
  const scores = b
    .map((cell, i) => {
      if (cell) return null;
      const next = b.slice();
      next[i] = isMax ? "O" : "X";
      return minimax(next, !isMax);
    })
    .filter((s): s is number => s !== null);
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(b: Cell[]): number {
  let best = -Infinity;
  let move = -1;
  b.forEach((cell, i) => {
    if (cell) return;
    const next = b.slice();
    next[i] = "O";
    const score = minimax(next, false);
    if (score > best) {
      best = score;
      move = i;
    }
  });
  return move;
}

const TicTacToe = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const result = useMemo(() => winnerOf(board), [board]);
  const full = board.every(Boolean);
  const over = !!result || full;

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  const play = (i: number) => {
    if (board[i] || over) return;

    if (mode === "friend") {
      const next = board.slice();
      next[i] = turn;
      setBoard(next);
      setTurn(turn === "X" ? "O" : "X");
      return;
    }

    // AI mode: human is X, computer is O
    if (turn !== "X") return;
    const afterHuman = board.slice();
    afterHuman[i] = "X";
    if (winnerOf(afterHuman) || afterHuman.every(Boolean)) {
      setBoard(afterHuman);
      return;
    }
    const ai = bestMove(afterHuman);
    if (ai >= 0) afterHuman[ai] = "O";
    setBoard(afterHuman);
  };

  if (!mode) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="font-display text-lg tracking-wide text-accent">Choose how to play</p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => {
              setMode("friend");
              reset();
            }}
            className="relative w-56 rounded-lg border border-border/60 bg-card/80 p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/70"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="mb-2 text-3xl">👥</div>
            <h4 className="font-display text-lg text-gold-gradient">With a friend</h4>
            <p className="mt-1 text-sm text-muted-foreground">Two players, X and O</p>
          </button>
          <button
            onClick={() => {
              setMode("ai");
              reset();
            }}
            className="relative w-56 rounded-lg border border-border/60 bg-card/80 p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/70"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="mb-2 text-3xl">🤖</div>
            <h4 className="font-display text-lg text-gold-gradient">Vs computer</h4>
            <p className="mt-1 text-sm text-muted-foreground">You are X — beat the AI</p>
          </button>
        </div>
      </div>
    );
  }

  const status = result
    ? mode === "ai"
      ? result.player === "X"
        ? "🎉 You win!"
        : "😈 The computer wins"
      : `🎉 Player ${result.player} wins!`
    : full
      ? "🤝 Draw"
      : mode === "ai"
        ? "Your turn (X)"
        : `Turn: Player ${turn}`;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="font-display text-lg tracking-wide text-accent">{status}</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const highlight = result?.line.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              disabled={!!cell || over}
              className={`flex h-20 w-20 items-center justify-center rounded-md border text-4xl font-bold transition-all sm:h-24 sm:w-24 ${
                highlight
                  ? "border-primary bg-primary/15 text-glow"
                  : "border-border/60 bg-secondary/60 hover:border-primary/70 hover:bg-secondary"
              } ${cell === "X" ? "text-primary" : "text-accent"}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline" className="border-primary/60 text-accent">
          New game
        </Button>
        <Button
          onClick={() => {
            setMode(null);
            reset();
          }}
          variant="ghost"
          className="text-muted-foreground"
        >
          Change mode
        </Button>
      </div>
    </div>
  );
};

export default TicTacToe;
