// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Root application shell.
//
// Architecture decision: NO React Router.
// Navigation is handled by a single `activeView` string in state.
// This eliminates every class of "redirect to /login on tab change" bug
// because there are no URL routes, no <Navigate>, no useNavigate calls,
// and no ProtectedRoute wrappers anywhere in the tree.
//
// When your backend is ready:
//  1. Flip SKIP_AUTH_GUARD → false in AuthContext.jsx
//  2. Restore a proper router if you need deep-linkable URLs
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { api } from "./api/config.js";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import AdminDashboard   from "./pages/AdminDashboard";
import CadetDashboard   from "./pages/CadetDashboard";
import CadetAttendance  from "./pages/CadetAttendance";
import CadetProfiles    from "./pages/CadetProfiles";
import MarkAttendance   from "./pages/MarkAttendance";
import ParadeSchedule   from "./pages/ParadeSchedule";
import Reports          from "./pages/Reports";

// ── View persistence (localStorage) ──────────────────────────────────────────
const VIEW_KEY    = "ncc_view";
const COLLEGE_KEY = "ncc_college";

function getSavedView()    { try { return localStorage.getItem(VIEW_KEY)    || "dashboard"; } catch { return "dashboard"; } }
function getSavedCollege() { try { return localStorage.getItem(COLLEGE_KEY) || null;        } catch { return null;        } }

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user: activeUser, logout: authLogout, isAuthenticated, loading } = useAuth();

  const [activeView,    setActiveViewRaw]    = useState(getSavedView);
  const [activeCollege, setActiveCollegeRaw] = useState(getSavedCollege);
  const [colleges,      setColleges]         = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Persistent view setter
  const setActiveView = useCallback((v) => {
    try { localStorage.setItem(VIEW_KEY, v); } catch {}
    setActiveViewRaw(v);
  }, []);

  // Persistent college setter
  const setActiveCollege = useCallback((id) => {
    try { localStorage.setItem(COLLEGE_KEY, id || ""); } catch {}
    setActiveCollegeRaw(id);
  }, []);

  // Sync colleges registry when a user is present
  useEffect(() => {
    if (!activeUser) return;
    setLoadingColleges(true);

    api.cadets.list()
      .then(() => {
        const list = [
          { id: "1", name: "Vellore Institute of Technology (VIT)" },
          { id: "2", name: "Madras Christian College (MCC)" },
        ];
        setColleges(list);
        if (!getSavedCollege()) setActiveCollege(list[0].id);
      })
      .catch((err) => {
        console.warn("[COLLEGES SYNC] Backend offline, using defaults:", err.message);
        const fallback = [{ id: "1", name: "VIT Vellore (NCC Unit)" }];
        setColleges(fallback);
        if (!getSavedCollege()) setActiveCollege(fallback[0].id);
      })
      .finally(() => setLoadingColleges(false));
  }, [activeUser, setActiveCollege]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await authLogout();
    try {
      localStorage.removeItem(COLLEGE_KEY);
      localStorage.setItem(VIEW_KEY, "dashboard");
    } catch {}
    setActiveCollegeRaw(null);
    setActiveViewRaw("dashboard");
  }, [authLogout]);

  // ── Wait for AuthContext hydration ────────────────────────────────────────
  if (loading) return null;

  // ── Auth gate (bypassed while SKIP_AUTH_GUARD = true) ────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", fontFamily: "sans-serif", color: "#334155",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>🔐</div>
        <p style={{ fontSize: 16, fontWeight: 600 }}>Login page coming soon.</p>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          Set <code>SKIP_AUTH_GUARD = true</code> in AuthContext.jsx to bypass.
        </p>
      </div>
    );
  }

  // ── Page router ───────────────────────────────────────────────────────────
  const role = activeUser?.role || "cadet";

  const renderPage = () => {
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
      {renderPage()}
    </Layout>
  );
}
