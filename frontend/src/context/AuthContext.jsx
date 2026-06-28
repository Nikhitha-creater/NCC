import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/config.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "ncc_portal_token";
const USER_KEY  = "ncc_portal_user";

// ── BYPASS FLAG ───────────────────────────────────────────────────────────────
// Set this to `true` while your login page is not yet implemented.
// Flip it back to `false` once your /login route exists.
const SKIP_AUTH_GUARD = true;

// A placeholder guest user so components that read `user.name` / `user.role`
// don't crash while the guard is bypassed.
const GUEST_USER = {
  name:  "Guest Cadet",
  role:  "cadet",
  unit:  "NCC Unit",
  email: "guest@ncc.local",
};

export function AuthProvider({ children }) {
  const [user,    setRuntimeUser] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    // If bypass is active, skip the whole localStorage check and
    // immediately inject the guest user so nothing downstream stalls.
    if (SKIP_AUTH_GUARD) {
      setRuntimeUser(GUEST_USER);
      setLoading(false);
      return;
    }

    try {
      const savedToken   = localStorage.getItem(TOKEN_KEY);
      const savedUserStr = localStorage.getItem(USER_KEY);

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setRuntimeUser(parsedUser);
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

  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      if (response?.token && response?.user) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setRuntimeUser(response.user);
        return response.user;
      }
      throw new Error("Invalid server token response structure.");
    } catch (error) {
      console.error("[AUTH CONTEXT ERROR]:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("Server-side logout could not resolve:", err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setRuntimeUser(SKIP_AUTH_GUARD ? GUEST_USER : null); // stay as guest in bypass mode
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin:         user?.role === "admin",
    isAuthenticated: SKIP_AUTH_GUARD ? true : !!user,  // always true in bypass mode
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only after hydration resolves — same as before */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
