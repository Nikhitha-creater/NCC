// src/components/Layout.jsx  –  App shell with sidebar navigation
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_NAV = [
  { section: "Overview" },
  { id: "/admin",            label: "Dashboard",       icon: "⊞" },
  { section: "Management" },
  { id: "/admin/attendance", label: "Mark Attendance", icon: "✔"  },
  { id: "/admin/cadets",     label: "Cadet Profiles",  icon: "👥" },
  { id: "/admin/reports",    label: "Reports",         icon: "📊" },
  { section: "Events" },
  { id: "/admin/parades",    label: "Parade Schedule", icon: "🎖️" },
];

const CADET_NAV = [
  { section: "My Portal" },
  { id: "/cadet",            label: "Dashboard",    icon: "⊞" },
  { id: "/cadet/attendance", label: "My Attendance",icon: "📋" },
  { id: "/cadet/schedule",   label: "Schedule",     icon: "📅" },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── REMOVED: any useEffect that called navigate("/login") ─────────────────
  // Previously there was likely a guard like:
  //   useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [...])
  // That block is intentionally deleted here. Re-add it once /login exists.
  // ─────────────────────────────────────────────────────────────────────────

  const navItems = isAdmin ? ADMIN_NAV : CADET_NAV;

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const initials = user
    ? user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"
    : "??";

  const handleLogout = async () => {
    await logout();
    // ── CHANGED: navigate to "/" instead of "/login" since /login doesn't exist yet.
    // Swap back to navigate("/login") once your login page is built.
    navigate("/");
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-emblem">🎖️</div>
          <div>
            <div className="sidebar-title">NCC Portal</div>
            <div className="sidebar-subtitle">Attendance System</div>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role || "Cadet"}</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-label">{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`nav-item ${location.pathname === item.id ? "active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ color: "rgba(255,255,255,.5)" }}
          >
            <span className="nav-icon">⇥</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3"  y1="6"  x2="21" y2="6"  />
                <line x1="3"  y1="12" x2="21" y2="12" />
                <line x1="3"  y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="topbar-title">NCC Attendance Portal</div>
          </div>

          <div className="topbar-right">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-900)" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--slate-500)", textTransform: "capitalize" }}>
                {user?.unit || "NCC Unit"} · {user?.role}
              </div>
            </div>
            <div className="sidebar-avatar"
                 style={{ border: "2px solid var(--navy-200)",
                          color: "var(--navy-700)",
                          background: "var(--navy-50)" }}>
              {initials}
            </div>
          </div>
        </header>

        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
