import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api/config.js";
import { useAuth } from "./context/AuthContext";   // ← ADD THIS
import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import CadetDashboard from "./pages/CadetDashboard";
import CadetAttendance from "./pages/CadetAttendance";
import CadetProfiles from "./pages/CadetProfiles";
import MarkAttendance from "./pages/MarkAttendance";
import ParadeSchedule from "./pages/ParadeSchedule";
import Reports from "./pages/Reports";
// ── Login import removed — page doesn't exist yet ──────────────────────────

// ── LOCAL STORAGE ENGINE (college + view only — auth now in AuthContext) ────
const LS = {
  getCollege() { return localStorage.getItem("ncc_college") || null; },
  getView()    { return localStorage.getItem("ncc_view")    || "dashboard"; },
  saveCollege(id) { localStorage.setItem("ncc_college", id || ""); },
  saveView(v)     { localStorage.setItem("ncc_view", v); },
  clearView()     { localStorage.setItem("ncc_view", "dashboard"); },
  clearCollege()  { localStorage.removeItem("ncc_college"); },
};

export default function App() {
  // ── Pull auth state from AuthContext (single source of truth) ─────────────
  const { user: activeUser, logout: authLogout, isAuthenticated, loading } = useAuth();

  const [activeCollege, setActiveCollegeRaw] = useState(LS.getCollege);
  const [activeView,    setActiveViewRaw]     = useState(LS.getView);
  const [colleges,      setColleges]          = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  const setActiveView = useCallback((v) => {
    LS.saveView(v);
    setActiveViewRaw(v);
  }, []);

  const setActiveCollege = useCallback((id) => {
    LS.saveCollege(id);
    setActiveCollegeRaw(id);
  }, []);

  // Sync colleges registry when user is present
  useEffect(() => {
    if (!activeUser) return;

    setLoadingColleges(true);
    api.cadets.list()
      .then(() => {
        const placeholderColleges = [
          { id: "1", name: "Vellore Institute of Technology (VIT)" },
          { id: "2", name: "Madras Christian College (MCC)" },
        ];
        setColleges(placeholderColleges);
        if (!LS.getCollege()) setActiveCollege(placeholderColleges[0].id);
      })
      .catch((err) => {
        console.warn("[COLLEGES SYNC WARN]:", err.message);
        const fallback = [{ id: "1", name: "VIT Vellore (NCC Unit)" }];
        setColleges(fallback);
        setActiveCollege("1");
      })
      .finally(() => setLoadingColleges(false));
  }, [activeUser, setActiveCollege]);

  const handleLogout = useCallback(() => {
    authLogout();            // delegates to AuthContext — clears its own keys
    LS.clearCollege();
    LS.clearView();
    setActiveCollegeRaw(null);
    setActiveViewRaw("dashboard");
  }, [authLogout]);

  // ── Wait for AuthContext hydration before rendering anything ───────────────
  // (prevents a flash-redirect before localStorage is read)
  if (loading) return null;

  // ── AUTHENTICATION GATE ────────────────────────────────────────────────────
  // With SKIP_AUTH_GUARD = true in AuthContext, isAuthenticated is always true,
  // so this block is never reached. Re-enable by flipping the flag back to false
  // once your /login route exists.
  if (!isAuthenticated) {
    // No <Login /> component yet — just show a placeholder so the app doesn't crash
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#334" }}>
        <p>🔐 Login page coming soon.</p>
      </div>
    );
  }

  // ── PAGE ROUTER ────────────────────────────────────────────────────────────
  const renderMainContent = () => {
    const role = activeUser?.role || "cadet";
    switch (activeView) {
      case "dashboard":      return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
      case "attendance":
      case "my-attendance":  return <CadetAttendance />;
      case "profiles":       return <CadetProfiles />;
      case "mark-attendance":return <MarkAttendance />;
      case "schedule":
      case "parades":        return <ParadeSchedule />;
      case "reports":        return <Reports />;
      default:               return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
    }
  };

  return (
    <Layout
      user={activeUser}
      activeView={activeView}
      onNav={setActiveView}
      onLogout={handleLogout}
      colleges={colleges}
      activeCollege={activeCollege}
      onCollegeChange={setActiveCollege}
      loadingColleges={loadingColleges}
    >
      {renderMainContent()}
    </Layout>
  );
}
