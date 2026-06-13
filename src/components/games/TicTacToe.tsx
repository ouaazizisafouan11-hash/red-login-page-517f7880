import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Cell = "X" | "O" | null;

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

// Minimax: O is the AI, X is the human
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
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const result = useMemo(() => winnerOf(board), [board]);
  const full = board.every(Boolean);
  const over = !!result || full;

  const play = (i: number) => {
    if (board[i] || over) return;
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

  const reset = () => setBoard(Array(9).fill(null));

  const status = result
    ? result.player === "X"
      ? "🎉 You win!"
      : "😈 The computer wins"
    : full
      ? "🤝 Draw"
      : "Your turn (X)";

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
                  ? "border-primary bg-primary/15 text-gold-gradient text-glow"
                  : "border-border/60 bg-secondary/60 hover:border-primary/70 hover:bg-secondary"
              } ${cell === "X" ? "text-primary" : "text-accent"}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      <Button onClick={reset} variant="outline" className="border-primary/60 text-accent">
        New game
      </Button>
    </div>
  );
};

export default TicTacToe;
