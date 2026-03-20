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
  shopId: string | null;
  shopName: string | null;
  shopAddress: string | null;
  shopPhone: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  userId: null,
  userName: null,
  role: null,
  shopId: null,
  shopName: null,
  shopAddress: null,
  shopPhone: null,
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
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [shopAddress, setShopAddress] = useState<string | null>(null);
  const [shopPhone, setShopPhone] = useState<string | null>(null);
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
          .select("name, role, shop_id, shops(name, address, phone)")
          .eq("id", user.id)
          .single();
        if (data) {
          setUserName(data.name);
          setRole(data.role as Role);
          setShopId(data.shop_id);
          const shop = data.shops as unknown as { name: string; address: string | null; phone: string | null } | null;
          setShopName(shop?.name ?? null);
          setShopAddress(shop?.address ?? null);
          setShopPhone(shop?.phone ?? null);
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
        setShopId(null);
        setShopName(null);
        setShopAddress(null);
        setShopPhone(null);
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
    <AuthCtx.Provider value={{ userId, userName, role, shopId, shopName, shopAddress, shopPhone, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
