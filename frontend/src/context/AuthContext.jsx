import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/config.js"; // Only import the api caller object

const AuthContext = createContext(null);

// Consistent keys used to look up values inside the browser's storage array
const TOKEN_KEY = "ncc_portal_token";
const USER_KEY = "ncc_portal_user";

export function AuthProvider({ children }) {
  const [user, setRuntimeUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate user state from localStorage cleanly on boot
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUserStr = localStorage.getItem(USER_KEY);

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setRuntimeUser(parsedUser);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.error("[AUTH HYDRATION ERROR]: Failed parsing session context keys:", err);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler utilizing clean native window storage mechanics
  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      
      if (response && response.token && response.user) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        
        setRuntimeUser(response.user);
        return response.user;
      } else {
        throw new Error("Invalid server token response structure.");
      }
    } catch (error) {
      console.error("[AUTH CONTEXT ERROR]:", error);
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("Server-side logout could not resolve:", err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setRuntimeUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
