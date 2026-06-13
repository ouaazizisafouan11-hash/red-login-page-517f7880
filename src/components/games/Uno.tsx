import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Color = "red" | "yellow" | "green" | "blue" | "wild";
type Card = { color: Color; value: string; id: string };

const COLORS: Color[] = ["red", "yellow", "green", "blue"];
const VALUES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"];
const NAMES = ["You", "Bot 1", "Bot 2", "Bot 3"];

const colorClass: Record<Color, string> = {
  red: "bg-red-600 text-white border-red-300",
  yellow: "bg-yellow-400 text-black border-yellow-200",
  green: "bg-green-600 text-white border-green-300",
  blue: "bg-blue-600 text-white border-blue-300",
  wild: "bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 text-white border-white",
};
const swatch: Record<Exclude<Color, "wild">, string> = {
  red: "#dc2626",
  yellow: "#facc15",
  green: "#16a34a",
  blue: "#2563eb",
};

let counter = 0;
const uid = () => `c${counter++}`;

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    for (const value of VALUES) {
      deck.push({ color, value, id: uid() });
      if (value !== "0") deck.push({ color, value, id: uid() });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild", id: uid() });
    deck.push({ color: "wild", value: "+4", id: uid() });
  }
  return shuffle(deck);
}

type State = {
  deck: Card[];
  hands: Card[][];
  top: Card;
  activeColor: Color;
  current: number;
  dir: 1 | -1;
  message: string;
  winner: number | null;
  awaitingColor: { from: number; card: Card } | null;
};

function freshState(): State {
  const deck = buildDeck();
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 7; i++) for (let p = 0; p < 4; p++) hands[p].push(deck.pop()!);
  let top = deck.pop()!;
  while (top.color === "wild") {
    deck.unshift(top);
    top = deck.pop()!;
  }
  return {
    deck,
    hands,
    top,
    activeColor: top.color,
    current: 0,
    dir: 1,
    message: "Your turn — play a matching card or draw",
    winner: null,
    awaitingColor: null,
  };
}

const Uno = () => {
  const g = useRef<State>(freshState());
  const [, force] = useState(0);
  const render = useCallback(() => force((n) => n + 1), []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const canPlay = (card: Card, st: State) =>
    card.color === "wild" || card.color === st.activeColor || card.value === st.top.value;

  const draw = (st: State, player: number, n: number) => {
    for (let i = 0; i < n; i++) {
      if (st.deck.length === 0) st.deck = shuffle(buildDeck());
      st.hands[player].push(st.deck.pop()!);
    }
  };

  const nextIndex = (st: State, from: number, steps = 1) =>
    (from + st.dir * steps + 4 * 10) % 4;

  const aiPickColor = (hand: Card[]): Color => {
    const counts: Record<string, number> = {};
    hand.forEach((c) => {
      if (c.color !== "wild") counts[c.color] = (counts[c.color] || 0) + 1;
    });
    let best: Color = COLORS[Math.floor(Math.random() * 4)];
    let bestN = -1;
    for (const c of COLORS)
      if ((counts[c] || 0) > bestN) {
        bestN = counts[c] || 0;
        best = c;
      }
    return best;
  };

  // Resolve a played card's effects and pass the turn.
  const resolveCard = (st: State, player: number, card: Card, chosenColor: Color) => {
    st.top = card;
    st.activeColor = card.color === "wild" ? chosenColor : card.color;
    st.hands[player] = st.hands[player].filter((c) => c.id !== card.id);

    if (st.hands[player].length === 0) {
      st.winner = player;
      st.message = player === 0 ? "🎉 You won UNO!" : `😈 ${NAMES[player]} won`;
      return;
    }

    let skip = 0;
    if (card.value === "reverse") st.dir = (st.dir === 1 ? -1 : 1) as 1 | -1;
    if (card.value === "skip") skip = 1;
    if (card.value === "+2") {
      const victim = nextIndex(st, player, 1);
      draw(st, victim, 2);
      skip = 1;
    }
    if (card.value === "+4") {
      const victim = nextIndex(st, player, 1);
      draw(st, victim, 4);
      skip = 1;
    }

    st.current = nextIndex(st, player, 1 + skip);
    st.message =
      st.current === 0 ? "Your turn — play a matching card or draw" : `${NAMES[st.current]} is playing…`;
  };

  const runAi = useCallback(() => {
    const st = g.current;
    if (st.winner !== null || st.current === 0 || st.awaitingColor) return;
    const player = st.current;
    const hand = st.hands[player];
    const idx = hand.findIndex((c) => canPlay(c, st));
    if (idx === -1) {
      draw(st, player, 1);
      const drew = hand[hand.length - 1];
      if (canPlay(drew, st)) {
        resolveCard(st, player, drew, drew.color === "wild" ? aiPickColor(hand) : drew.color);
      } else {
        st.message = `${NAMES[player]} drew a card.`;
        st.current = nextIndex(st, player, 1);
      }
    } else {
      const card = hand[idx];
      resolveCard(st, player, card, card.color === "wild" ? aiPickColor(hand) : card.color);
    }
    render();
    scheduleAi();
  }, [render]);

  const scheduleAi = useCallback(() => {
    const st = g.current;
    if (st.winner === null && st.current !== 0 && !st.awaitingColor) {
      const t = setTimeout(runAi, 850);
      timers.current.push(t);
    }
  }, [runAi]);

  const onPlay = (card: Card) => {
    const st = g.current;
    if (st.current !== 0 || st.winner !== null || st.awaitingColor) return;
    if (!canPlay(card, st)) {
      st.message = "That card doesn't match — same color or same number.";
      render();
      return;
    }
    if (card.color === "wild") {
      st.awaitingColor = { from: 0, card };
      st.message = "Pick a color for your wild card";
      render();
      return;
    }
    resolveCard(st, 0, card, card.color);
    render();
    scheduleAi();
  };

  const chooseColor = (color: Exclude<Color, "wild">) => {
    const st = g.current;
    if (!st.awaitingColor) return;
    const { card } = st.awaitingColor;
    st.awaitingColor = null;
    resolveCard(st, 0, card, color);
    render();
    scheduleAi();
  };

  const onDraw = () => {
    const st = g.current;
    if (st.current !== 0 || st.winner !== null || st.awaitingColor) return;
    draw(st, 0, 1);
    const drew = st.hands[0][st.hands[0].length - 1];
    if (canPlay(drew, st)) {
      st.message = "You drew a playable card — play it or draw again ends turn.";
      render();
    } else {
      st.message = "No match, you drew a card.";
      st.current = nextIndex(st, 0, 1);
      render();
      scheduleAi();
    }
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    g.current = freshState();
    render();
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const st = g.current;

  const renderCard = (card: Card, onClick?: () => void, dim = false) => (
    <button
      key={card.id}
      onClick={onClick}
      disabled={!onClick}
      className={`flex h-20 w-14 shrink-0 flex-col items-center justify-center rounded-md border-2 text-xs font-bold shadow-md transition-transform ${colorClass[card.color]} ${
        onClick ? "cursor-pointer hover:-translate-y-2" : ""
      } ${dim ? "opacity-50" : ""}`}
    >
      <span className="text-base leading-none">{card.value === "wild" ? "★" : card.value}</span>
    </button>
  );

  const Bot = ({ idx }: { idx: number }) => (
    <div
      className={`flex flex-col items-center gap-1 rounded-md border px-3 py-2 ${
        st.current === idx ? "border-primary bg-primary/10" : "border-border/40"
      }`}
    >
      <span className="font-display text-xs text-accent">
        {NAMES[idx]} · {st.hands[idx].length}
      </span>
      <div className="flex gap-0.5">
        {st.hands[idx].slice(0, 8).map((c) => (
          <div
            key={c.id}
            className="h-6 w-4 rounded-sm border border-primary/40 bg-gradient-to-br from-secondary to-black"
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex w-full max-w-[680px] flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Bot idx={1} />
        <Bot idx={2} />
        <Bot idx={3} />
      </div>

      <div className="flex items-center gap-2 font-display text-sm text-accent">
        Active color:
        <span
          className="inline-block h-3 w-3 rounded-full border border-white/40"
          style={{ background: st.activeColor === "wild" ? "#999" : swatch[st.activeColor] }}
        />
        <span className="capitalize">{st.activeColor}</span>
        <span className="text-muted-foreground">· dir {st.dir === 1 ? "↻" : "↺"}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="scale-110">{renderCard(st.top, undefined, false)}</div>
        <Button
          onClick={onDraw}
          variant="outline"
          disabled={st.current !== 0 || st.winner !== null || !!st.awaitingColor}
          className="border-primary/60 text-accent"
        >
          Draw
        </Button>
      </div>

      <p className="min-h-[1.5rem] text-center font-display text-sm text-accent">{st.message}</p>

      {st.awaitingColor && (
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => chooseColor(c as Exclude<Color, "wild">)}
              className="h-9 w-9 rounded-full border-2 border-white/60"
              style={{ background: swatch[c as Exclude<Color, "wild">] }}
              aria-label={c}
            />
          ))}
        </div>
      )}

      <div className="flex max-w-full flex-wrap justify-center gap-2 pb-2">
        {st.hands[0].map((c) =>
          renderCard(
            c,
            st.current === 0 && !st.winner && !st.awaitingColor ? () => onPlay(c) : undefined,
            !canPlay(c, st),
          ),
        )}
      </div>

      {st.winner !== null && (
        <Button onClick={reset} className="bg-primary text-primary-foreground">
          Play again
        </Button>
      )}
    </div>
  );
};

export default Uno;
