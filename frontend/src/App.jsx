import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api/config.js";
import { useAuth } from "./context/AuthContext";   

import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import CadetDashboard from "./pages/CadetDashboard";
import CadetAttendance from "./pages/CadetAttendance";
import CadetProfiles from "./pages/CadetProfiles";
import MarkAttendance from "./pages/MarkAttendance";
import ParadeSchedule from "./pages/ParadeSchedule";
import Reports from "./pages/Reports";

// ── LOCAL STORAGE ENGINE (college + view only) ────
const LS = {
  getCollege() { return localStorage.getItem("ncc_college") || null; },
  getView()    { return localStorage.getItem("ncc_view")     || "dashboard"; },
  saveCollege(id) { localStorage.setItem("ncc_college", id || ""); },
  saveView(v)      { localStorage.setItem("ncc_view", v); },
  clearView()      { localStorage.setItem("ncc_view", "dashboard"); },
  clearCollege()  { localStorage.removeItem("ncc_college"); },
};

export default function App() {
  // ── Pull auth state from AuthContext ──────────────────────────────────────
  const { user: contextUser, logout: authLogout, isAuthenticated, loading } = useAuth();

  // MOCK USER FALLBACK: If AuthContext hasn't set a user yet because we are bypassing, 
  // we provide a stable mock user object so the pages don't crash or attempt toxic redirects.
  const activeUser = contextUser || { name: "Cadet", role: "cadet", email: "cadet@vit.edu" };

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

  // Sync colleges registry 
  useEffect(() => {
    // We always run this since we are providing a mock fallback user
    setLoadingColleges(true);
    
    // Safely attempt the list call, but always supply a graceful placeholder 
    // so API 401 interceptors don't wreck tab navigation.
    api.cadets.list()
      .then(() => {
        const placeholderColleges = [
          { id: "1", name: "VIT Vellore (NCC Unit)" },
          { id: "2", name: "Madras Christian College (MCC)" },
        ];
        setColleges(placeholderColleges);
        if (!LS.getCollege()) setActiveCollege(placeholderColleges[0].id);
      })
      .catch((err) => {
        console.warn("[COLLEGES SYNC BYPASS]: Using frontend mock metadata.", err.message);
        const fallback = [{ id: "1", name: "VIT Vellore (NCC Unit)" }];
        setColleges(fallback);
        if (!LS.getCollege()) setActiveCollege("1");
      })
      .finally(() => setLoadingColleges(false));
  }, [setActiveCollege]);

  const handleLogout = useCallback(() => {
    authLogout();            
    LS.clearCollege();
    LS.clearView();
    setActiveCollegeRaw(null);
    setActiveViewRaw("dashboard");
  }, [authLogout]);

  // ── Wait for AuthContext hydration before rendering anything ───────────────
  if (loading) return null;

  // ── AUTHENTICATION GATE ────────────────────────────────────────────────────
  // Since SKIP_AUTH_GUARD = true, isAuthenticated is true. If it somehow drops out,
  // this clean layout handles it gracefully without a crash.
  if (!isAuthenticated) {
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
      case "dashboard":       return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
      case "attendance":
      case "my-attendance":   return <CadetAttendance />;
      case "profiles":        return <CadetProfiles />;
      case "mark-attendance": return <MarkAttendance />;
      case "schedule":
      case "parades":         return <ParadeSchedule />;
      case "reports":         return <Reports />;
      default:                return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
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
