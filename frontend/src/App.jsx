import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api/config.js";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import CadetDashboard from "./pages/CadetDashboard";
import CadetAttendance from "./pages/CadetAttendance";
import CadetProfiles from "./pages/CadetProfiles";
import MarkAttendance from "./pages/MarkAttendance";
import ParadeSchedule from "./pages/ParadeSchedule";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

// ── LOCAL STORAGE ENGINE ────────────────────────────────────────────────────
const LS = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("ncc_user") || "null");
    } catch {
      return null;
    }
  },
  getCollege() {
    return localStorage.getItem("ncc_college") || null;
  },
  getView() {
    return localStorage.getItem("ncc_view") || "dashboard";
  },
  saveUser(u) {
    localStorage.setItem("ncc_user", JSON.stringify(u));
  },
  saveCollege(id) {
    localStorage.setItem("ncc_college", id || "");
  },
  saveView(v) {
    localStorage.setItem("ncc_view", v);
  },
  clear() {
    localStorage.removeItem("ncc_user");
    localStorage.removeItem("ncc_college");
    localStorage.setItem("ncc_view", "dashboard");
  }
};

export default function App() {
  // Synchronous state initialization from localStorage triggers before mount
  const [activeUser, setActiveUser] = useState(LS.getUser);
  const [activeCollege, setActiveCollegeRaw] = useState(LS.getCollege);
  const [activeView, setActiveViewRaw] = useState(LS.getView);
  
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [collegeError, setCollegeError] = useState(null);

  // Persistent setters
  const setActiveView = useCallback((v) => {
    LS.saveView(v);
    setActiveViewRaw(v);
  }, []);

  const setActiveCollege = useCallback((id) => {
    LS.saveCollege(id);
    setActiveCollegeRaw(id);
  }, []);

  // Sync colleges registry ONLY when user is present
  useEffect(() => {
    if (!activeUser) return;

    setLoadingColleges(true);
    setCollegeError(null);

    api.cadets.list() // Using safe fetch wrapper
      .then(() => {
        // Mocking localized operational colleges registry fallback strings
        const placeholderColleges = [
          { id: "1", name: "Vellore Institute of Technology (VIT)" },
          { id: "2", name: "Madras Christian College (MCC)" }
        ];
        setColleges(placeholderColleges);
        if (!LS.getCollege()) {
          setActiveCollege(placeholderColleges[0].id);
        }
      })
      .catch((err) => {
        console.warn("[COLLEGES SYNC WARN] Using sandbox registry setup:", err.message);
        const fallback = [{ id: "1", name: "VIT Vellore (NCC Unit)" }];
        setColleges(fallback);
        setActiveCollege("1");
      })
      .finally(() => setLoadingColleges(false));
  }, [activeUser, setActiveCollege]);

  // Handle authentication login transitions
  const handleLogin = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      if (response && response.user) {
        LS.saveUser(response.user);
        setActiveUser(response.user);
        setActiveView("dashboard");
        return response.user;
      }
    } catch (err) {
      console.error("Login attempt rejected:", err);
      throw err;
    }
  };

  // Handle logout clean up
  const handleLogout = useCallback(() => {
    LS.clear();
    setActiveUser(null);
    setActiveCollegeRaw(null);
    setActiveViewRaw("dashboard");
  }, []);

  // ── AUTHENTICATION GATE GUARD ─────────────────────────────────────────────
  if (!activeUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // ── SUB-COMPONENT PAGE SWITCH ROUTER MAP ──────────────────────────────────
  const renderMainContent = () => {
    const role = activeUser?.role || "cadet";

    switch (activeView) {
      case "dashboard":
        return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
      case "attendance":
      case "my-attendance":
        return <CadetAttendance />;
      case "profiles":
        return <CadetProfiles />;
      case "mark-attendance":
        return <MarkAttendance />;
      case "schedule":
      case "parades":
        return <ParadeSchedule />;
      case "reports":
        return <Reports />;
      default:
        return role === "admin" ? <AdminDashboard /> : <CadetDashboard />;
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
