import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const manualSignOutRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null, forceClear = false) => {
      if (!mounted) return;

      if (nextSession) {
        sessionRef.current = nextSession;
        setSession(nextSession);
        setUser(nextSession.user);
        return;
      }

      if (forceClear || !sessionRef.current) {
        sessionRef.current = null;
        setSession(null);
        setUser(null);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        applySession(null, manualSignOutRef.current);
        manualSignOutRef.current = false;
        setLoading(false);
        return;
      }

      if (newSession) {
        applySession(newSession);
        setLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: existing } }) => {
        applySession(existing);
        if (mounted) setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    manualSignOutRef.current = true;
    sessionRef.current = null;
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
