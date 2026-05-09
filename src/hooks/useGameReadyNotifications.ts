import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const SESSION_KEY = "game_session_id";
const NOTIFIED_KEY = "game_notified_ids";

const getSessionId = () => {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
};

const getNotified = (): Set<string> => {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
};
const saveNotified = (s: Set<string>) => {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(s).slice(-200)));
  } catch {}
};

const playChime = () => {
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1175, 1568];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      o.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.25, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      o.start(start);
      o.stop(start + 0.4);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {}
};

/**
 * Globally listens for the user's games turning to "ready" and fires
 * a browser notification + toast + sound, regardless of which page is open.
 */
export const useGameReadyNotifications = () => {
  const notifiedRef = useRef<Set<string>>(getNotified());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Try silently; browsers require user gesture, so this may be ignored
      Notification.requestPermission().catch(() => {});
    }

    const sessionId = getSessionId();

    const announce = (id: string, title: string) => {
      if (notifiedRef.current.has(id)) return;
      notifiedRef.current.add(id);
      saveNotified(notifiedRef.current);

      toast.success(`🎉 "${title}" est prêt à jouer !`, {
        description: "Clique sur Mes jeux pour le lancer.",
        duration: 10000,
      });
      playChime();
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const n = new Notification("🎮 Ton jeu est prêt !", {
            body: `"${title}" a fini de se générer. Clique pour jouer.`,
            tag: `game-${id}`,
          });
          n.onclick = () => {
            window.focus();
            window.location.href = `/play/${id}`;
            n.close();
          };
        } catch {}
      }
    };

    // Catch up: any game that became ready while we were offline
    supabase
      .from("games")
      .select("id,title,status")
      .eq("session_id", sessionId)
      .eq("status", "ready")
      .order("completed_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return;
        // Mark older ones as notified silently to avoid spam on first load
        const fresh = data.filter((g) => !notifiedRef.current.has(g.id));
        fresh.forEach((g) => {
          notifiedRef.current.add(g.id);
        });
        saveNotified(notifiedRef.current);
      });

    const channel = supabase
      .channel("games-global-notify")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `session_id=eq.${sessionId}` },
        (payload: { new: { id: string; title: string; status: string } }) => {
          const g = payload.new;
          if (g?.status === "ready") announce(g.id, g.title);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
