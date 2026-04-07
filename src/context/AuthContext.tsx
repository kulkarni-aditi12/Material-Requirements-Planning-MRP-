import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface LoginApiResponse {
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: "admin" | "staff";
  };
  token?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:5000/api";
const USER_STORAGE_KEY = "smartmrp_user";
const TOKEN_STORAGE_KEY = "smartmrp_token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Failed to restore auth state:", err);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const saveAuth = (nextUser: User, token?: string) => {
    setUser(nextUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  };

  const loginWithBackend = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data: LoginApiResponse = await res.json();

      if (!data?.user || !data.user.email || !data.user.role) {
        return false;
      }

      const backendUser: User = {
        id: data.user.id || data.user._id || data.user.email,
        name: data.user.name || "User",
        email: data.user.email,
        role: data.user.role,
      };

      saveAuth(backendUser, data.token);
      return true;
    } catch (err) {
      console.warn("Backend auth unavailable, falling back to demo login.");
      return false;
    }
  };

  const loginWithDemo = async (email: string, password: string): Promise<boolean> => {
    if (email === "admin@sunrise.com" && password === "admin123") {
      const demoAdmin: User = {
        id: "1",
        name: "John Admin",
        email: "admin@sunrise.com",
        role: "admin",
      };
      saveAuth(demoAdmin);
      return true;
    }

    if (email === "staff@sunrise.com" && password === "staff123") {
      const demoStaff: User = {
        id: "2",
        name: "Jane Staff",
        email: "staff@sunrise.com",
        role: "staff",
      };
      saveAuth(demoStaff);
      return true;
    }

    return false;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const backendSuccess = await loginWithBackend(email, password);
    if (backendSuccess) return true;

    return loginWithDemo(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};