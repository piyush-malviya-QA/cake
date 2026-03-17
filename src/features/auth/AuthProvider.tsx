"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

interface AuthContext {
  userId: string | null;
  userName: string | null;
  role: Role | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  userId: null,
  userName: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export function useAuthContext() {
  return useContext(AuthCtx);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("employees")
          .select("name, role")
          .eq("id", user.id)
          .single();
        if (data) {
          setUserName(data.name);
          setRole(data.role as Role);
        }
      }
      setLoading(false);
    }
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUserId(null);
        setUserName(null);
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AuthCtx.Provider value={{ userId, userName, role, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
