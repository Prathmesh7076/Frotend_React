"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { User, LoginRequest } from "@/types";
import { login as loginApi } from "@/services/authApi";
import { clearToken, setToken, getToken } from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const restoreAuth = useCallback(() => {
    const token = getToken();
    if (token) {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          clearToken();
          localStorage.removeItem("auth_user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const ranInitialRouteRef = React.useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    const token = getToken();
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || (pathname && pathname.startsWith(p + "/"))
    );

    if (ranInitialRouteRef.current) {
      if (!pathname) return;
    }
    ranInitialRouteRef.current = true;

    if (!token && !isPublic) {
      router.replace("/login");
    } else if (token && pathname === "/login") {
      router.replace("/products");
    }
  }, [isLoading, pathname, router]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await loginApi(credentials);
        setToken(result.token);
        localStorage.setItem("auth_user", JSON.stringify(result));
        setUser(result);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback((): void => {
    clearToken();
    localStorage.removeItem("auth_user");
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getToken(),
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
