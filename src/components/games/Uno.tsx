import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Color = "red" | "yellow" | "green" | "blue" | "wild";
type Card = { color: Color; value: string; id: string };

const COLORS: Color[] = ["red", "yellow", "green", "blue"];
const VALUES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "+2"];

const colorClass: Record<Color, string> = {
  red: "bg-red-600 text-white border-red-300",
  yellow: "bg-yellow-400 text-black border-yellow-200",
  green: "bg-green-600 text-white border-green-300",
  blue: "bg-blue-600 text-white border-blue-300",
  wild: "bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 text-white border-white",
};

let counter = 0;
const uid = () => `c${counter++}`;

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

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playable(card: Card, top: Card, activeColor: Color): boolean {
  if (card.color === "wild") return true;
  return card.color === activeColor || card.value === top.value;
}

const Uno = () => {
  const [seed, setSeed] = useState(0);
  const init = useMemo(() => {
    const deck = buildDeck();
    const player: Card[] = [];
    const ai: Card[] = [];
    for (let i = 0; i < 7; i++) {
      player.push(deck.pop()!);
      ai.push(deck.pop()!);
    }
    let first = deck.pop()!;
    while (first.color === "wild") {
      deck.unshift(first);
      first = deck.pop()!;
    }
    return { deck, player, ai, first };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const [deck, setDeck] = useState<Card[]>(init.deck);
  const [player, setPlayer] = useState<Card[]>(init.player);
  const [ai, setAi] = useState<Card[]>(init.ai);
  const [top, setTop] = useState<Card>(init.first);
  const [activeColor, setActiveColor] = useState<Color>(init.first.color);
  const [turn, setTurn] = useState<"player" | "ai">("player");
  const [message, setMessage] = useState("Your turn — play a matching card");
  const [winner, setWinner] = useState<null | "player" | "ai">(null);

  const reset = () => {
    setSeed((s) => s + 1);
    const fresh = (() => {
      const d = buildDeck();
      const p: Card[] = [];
      const a: Card[] = [];
      for (let i = 0; i < 7; i++) {
        p.push(d.pop()!);
        a.push(d.pop()!);
      }
      let f = d.pop()!;
      while (f.color === "wild") {
        d.unshift(f);
        f = d.pop()!;
      }
      return { d, p, a, f };
    })();
    setDeck(fresh.d);
    setPlayer(fresh.p);
    setAi(fresh.a);
    setTop(fresh.f);
    setActiveColor(fresh.f.color);
    setTurn("player");
    setMessage("Your turn — play a matching card");
    setWinner(null);
  };

  const drawFrom = (current: Card[], n: number): [Card[], Card[]] => {
    let d = deck.slice();
    const drawn: Card[] = [];
    for (let i = 0; i < n; i++) {
      if (d.length === 0) d = shuffle(buildDeck());
      drawn.push(d.pop()!);
    }
    setDeck(d);
    return [[...current, ...drawn], drawn];
  };

  const chooseAiColor = (hand: Card[]): Color => {
    const counts: Record<string, number> = {};
    hand.forEach((c) => {
      if (c.color !== "wild") counts[c.color] = (counts[c.color] || 0) + 1;
    });
    let bestColor: Color = COLORS[Math.floor(Math.random() * 4)];
    let bestN = -1;
    for (const c of COLORS) {
      if ((counts[c] || 0) > bestN) {
        bestN = counts[c] || 0;
        bestColor = c;
      }
    }
    return bestColor;
  };

  const aiTurn = (curTop: Card, curColor: Color) => {
    setTimeout(() => {
      let hand = ai.slice();
      const idx = hand.findIndex((c) => playable(c, curTop, curColor));
      if (idx === -1) {
        const [newHand] = drawFrom(hand, 1);
        const drew = newHand[newHand.length - 1];
        if (playable(drew, curTop, curColor)) {
          const after = newHand.filter((c) => c.id !== drew.id);
          applyCard(drew, after, "ai");
        } else {
          setAi(newHand);
          setMessage("Computer drew a card. Your turn.");
          setTurn("player");
        }
        return;
      }
      const card = hand[idx];
      hand = hand.filter((c) => c.id !== card.id);
      applyCard(card, hand, "ai");
    }, 750);
  };

  const applyCard = (card: Card, restHand: Card[], who: "player" | "ai") => {
    setTop(card);
    let color: Color = card.color;
    if (card.color === "wild") {
      color = who === "ai" ? chooseAiColor(restHand) : activeColor;
    }
    setActiveColor(color);

    if (who === "player") setPlayer(restHand);
    else setAi(restHand);

    if (restHand.length === 0) {
      setWinner(who);
      setMessage(who === "player" ? "🎉 You won UNO!" : "😈 Computer won");
      return;
    }

    // handle action cards: opponent draws / skip => same player keeps turn for skip/reverse(2p)
    const opponentIs = who === "player" ? "ai" : "player";
    let drawN = 0;
    if (card.value === "+2") drawN = 2;
    if (card.value === "+4") drawN = 4;

    const skipsOpponent = ["skip", "reverse", "+2", "+4"].includes(card.value);

    if (drawN > 0) {
      if (opponentIs === "ai") {
        const [h] = drawFrom(ai, drawN);
        setAi(h);
      } else {
        const [h] = drawFrom(player, drawN);
        setPlayer(h);
      }
    }

    if (skipsOpponent) {
      // same player plays again
      if (who === "player") {
        setMessage("Action card! Play again.");
        setTurn("player");
      } else {
        setMessage("Computer played an action card.");
        aiTurn(card, color);
      }
    } else {
      if (who === "player") {
        setMessage("Computer's turn…");
        setTurn("ai");
        aiTurn(card, color);
      } else {
        setMessage("Your turn — play a matching card");
        setTurn("player");
      }
    }
  };

  const onPlay = (card: Card) => {
    if (turn !== "player" || winner) return;
    if (!playable(card, top, activeColor)) {
      setMessage("That card doesn't match. Pick red/yellow/green/blue or same number.");
      return;
    }
    const rest = player.filter((c) => c.id !== card.id);
    if (card.color === "wild") {
      // choose dominant color from remaining hand for simplicity
      const color = chooseAiColor(rest);
      setActiveColor(color);
      applyCard({ ...card }, rest, "player");
      return;
    }
    applyCard(card, rest, "player");
  };

  const onDraw = () => {
    if (turn !== "player" || winner) return;
    const [newHand] = drawFrom(player, 1);
    const drew = newHand[newHand.length - 1];
    if (playable(drew, top, activeColor)) {
      setPlayer(newHand);
      setMessage("You drew a playable card — play it!");
    } else {
      setPlayer(newHand);
      setMessage("No match, drew a card. Computer's turn.");
      setTurn("ai");
      aiTurn(top, activeColor);
    }
  };

  const dot = (
    <span
      className="inline-block h-3 w-3 rounded-full border border-white/40"
      style={{
        background:
          activeColor === "red"
            ? "#dc2626"
            : activeColor === "yellow"
              ? "#facc15"
              : activeColor === "green"
                ? "#16a34a"
                : activeColor === "blue"
                  ? "#2563eb"
                  : "#999",
      }}
    />
  );

  const renderCard = (card: Card, onClick?: () => void, dim = false) => (
    <button
      key={card.id}
      onClick={onClick}
      disabled={!onClick}
      className={`flex h-20 w-14 shrink-0 flex-col items-center justify-center rounded-md border-2 text-xs font-bold shadow-md transition-transform ${colorClass[card.color]} ${
        onClick ? "hover:-translate-y-2 cursor-pointer" : ""
      } ${dim ? "opacity-90" : ""}`}
    >
      <span className="text-base leading-none">{card.value === "wild" ? "★" : card.value}</span>
    </button>
  );

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
      <div className="flex items-center gap-2 font-display text-sm text-accent">
        Active color: {dot} <span className="capitalize">{activeColor}</span>
      </div>

      {/* AI hand (face down) */}
      <div className="flex items-center gap-2">
        <span className="font-display text-xs text-muted-foreground">Computer: {ai.length}</span>
        <div className="flex gap-1">
          {ai.slice(0, 10).map((c) => (
            <div
              key={c.id}
              className="h-10 w-7 rounded-sm border border-primary/40 bg-gradient-to-br from-secondary to-black"
            />
          ))}
        </div>
      </div>

      {/* Discard pile */}
      <div className="flex items-center gap-4">
        <div className="scale-110">{renderCard(top, undefined, true)}</div>
        <Button
          onClick={onDraw}
          variant="outline"
          disabled={turn !== "player" || !!winner}
          className="border-primary/60 text-accent"
        >
          Draw
        </Button>
      </div>

      <p className="min-h-[1.5rem] text-center font-display text-sm text-accent">{message}</p>

      {/* Player hand */}
      <div className="flex max-w-full flex-wrap justify-center gap-2 overflow-x-auto pb-2">
        {player.map((c) =>
          renderCard(c, () => onPlay(c), !playable(c, top, activeColor)),
        )}
      </div>

      {winner && (
        <Button onClick={reset} className="bg-primary text-primary-foreground">
          Play again
        </Button>
      )}
    </div>
  );
};

export default Uno;
