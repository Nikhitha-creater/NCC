// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Single auth source of truth.
//
// SKIP_AUTH_GUARD = true  →  injects GUEST_USER immediately; no localStorage
//                             check; isAuthenticated is always true.
//                             Flip to false once your backend & /login exist.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/config.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "ncc_portal_token";
const USER_KEY  = "ncc_portal_user";

// ── Dev bypass ────────────────────────────────────────────────────────────────
const SKIP_AUTH_GUARD = true;   // ← flip to false when login page is ready

const GUEST_USER = {
  id:    "guest-001",
  name:  "NCC Cadet",
  role:  "cadet",
  unit:  "NCC Unit",
  email: "cadet@ncc.local",
  regNo: "NCC/TN/VIT/2023/0047",
  battalion: "7 TN BN NCC",
};

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setRuntimeUser] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (SKIP_AUTH_GUARD) {
      setRuntimeUser(GUEST_USER);
      setLoading(false);
      return;
    }

    try {
      const savedToken   = localStorage.getItem(TOKEN_KEY);
      const savedUserStr = localStorage.getItem(USER_KEY);

      if (savedToken && savedUserStr) {
        setRuntimeUser(JSON.parse(savedUserStr));
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error("[AUTH HYDRATION ERROR]:", err);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      if (response?.token && response?.user) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setRuntimeUser(response.user);
        return response.user;
      }
      throw new Error("Invalid server response structure.");
    } catch (error) {
      console.error("[AUTH LOGIN ERROR]:", error);
      throw error;
    }
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("[AUTH LOGOUT WARN]:", err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // In bypass mode stay as guest so the app doesn't crash on sign-out
      setRuntimeUser(SKIP_AUTH_GUARD ? GUEST_USER : null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin:         user?.role === "admin",
    isAuthenticated: SKIP_AUTH_GUARD ? true : !!user,
  };

  // Don't render children until hydration is done (prevents flash redirects)
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
