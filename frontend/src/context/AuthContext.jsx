// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getToken, getUser, setToken, setUser, clearToken, clearUser } from "../api/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser);
  const [loading, setLoading] = useState(!!getToken()); // verify token on mount

  // On mount, re-verify token with backend if one exists
  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    api.auth.me()
      .then((data) => {
        const u = data.user || data;
        setUserState(u);
        setUser(u);
      })
      .catch(() => { clearToken(); clearUser(); setUserState(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.auth.login(credentials);
    const token = data.token || data.access_token;
    const u = data.user || data;
    if (token) setToken(token);
    setUser(u);
    setUserState(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    clearToken();
    clearUser();
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