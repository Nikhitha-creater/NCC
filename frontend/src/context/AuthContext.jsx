// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
// Pointing directly to your clean src/config.js file
import { api } from "../config"; 

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Safe initialization checks using localStorage directly since config is just the API client
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem("ncc_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem("ncc_token"));

  useEffect(() => {
    const token = localStorage.getItem("ncc_token");
    if (!token) { setLoading(false); return; }
    
    // Check current user details from backend
    api.get("/auth/me")
      .then((res) => {
        const u = res.data?.user || res.data;
        setUserState(u);
        localStorage.setItem("ncc_user", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem("ncc_token");
        localStorage.removeItem("ncc_user");
        setUserState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    const data = res.data;
    const token = data.token || data.access_token;
    const u = data.user || data;
    
    if (token) localStorage.setItem("ncc_token", token);
    localStorage.setItem("ncc_user", JSON.stringify(u));
    setUserState(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("ncc_token");
    localStorage.removeItem("ncc_user");
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" || user?.role === "ano" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};