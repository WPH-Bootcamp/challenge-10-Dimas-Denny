"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { decodeJwtPayload } from "@/lib/jwt";

export type User = {
  id: number;
  email: string;
  name?: string; // optional (karena token kamu tidak bawa name)
};

type LoginPayload = {
  token: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // init dari token (tanpa API call)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const payload = decodeJwtPayload<{
      id: number;
      email: string;
      exp?: number;
    }>(token);

    // optional: cek expired
    if (!payload?.id || !payload?.email) {
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
      return;
    }

    // kalau exp ada dan sudah lewat, logout
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
      return;
    }

    setUser({ id: payload.id, email: payload.email });
    setLoading(false);
  }, []);

  const login = async ({ token }: LoginPayload) => {
    localStorage.setItem("token", token);

    const payload = decodeJwtPayload<{
      id: number;
      email: string;
      exp?: number;
    }>(token);
    if (!payload?.id || !payload?.email) {
      throw new Error("Invalid token payload");
    }

    setUser({ id: payload.id, email: payload.email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
