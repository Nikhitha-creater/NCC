// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { api, getToken, setToken, clearToken, getUser, setUser, clearUser } from "../api/config.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setRuntimeUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate user state from localStorage on boot
  useEffect(() => {
    const savedUser = getUser();
    const token = getToken();
    if (savedUser && token) {
      setRuntimeUser(savedUser);
    } else {
      // Clean up if mismatched states exist
      clearToken();
      clearUser();
    }
    setLoading(false);
  }, []);

  // Login handler utilizing your exact api.auth.login wrapper tree
  const login = async (credentials) => {
    try {
      // ✅ Using your configured structure instead of calling a broken .post function
      const response = await api.auth.login(credentials);
      
      if (response && response.token) {
        setToken(response.token);
        setUser(response.user);
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
      clearToken();
      clearUser();
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