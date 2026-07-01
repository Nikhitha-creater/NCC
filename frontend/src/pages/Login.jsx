// src/components/Layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// App shell: sidebar + topbar + page body.
//
// KEY AUDIT FIX: This component previously imported useNavigate / useLocation
// from react-router-dom AND called useAuth() to check isAuthenticated, then
// redirected to "/login" inside a useEffect.  ALL of that has been removed.
//
// Navigation is now 100% prop-driven:
//   • onNav(viewId)  — called when the user clicks a sidebar link
//   • onLogout()     — called when the user clicks Sign Out
//   • activeView     — string controlled by App; used to highlight active link
//
// No router imports. No auth checks. No redirects. This component only renders.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";

// ── Navigation definitions ────────────────────────────────────────────────────
const ADMIN_NAV = [
  { section: "Overview" },
  { id: "dashboard",       label: "Dashboard",       icon: "⊞" },
  { section: "Management" },
  { id: "mark-attendance", label: "Mark Attendance", icon: "✔" },
  { id: "profiles",        label: "Cadet Profiles",  icon: "👥" },
  { id: "reports",         label: "Reports",         icon: "📊" },
  { section: "Events" },
  { id: "parades",         label: "Parade Schedule", icon: "🎖️" },
];

const CADET_NAV = [
  { section: "My Portal" },
  { id: "dashboard",    label: "Dashboard",    icon: "⊞" },
  { id: "my-attendance",label: "My Attendance",icon: "📋" },
  { id: "schedule",     label: "Schedule",     icon: "📅" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Layout({
  children,
  user,
  activeView,
  onNav,
  onLogout,
  colleges       = [],
  activeCollege  = null,
  onCollegeChange,
  loadingColleges = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin  = user?.role === "admin";
  const navItems = isAdmin ? ADMIN_NAV : CADET_NAV;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "NC";

  const handleNav = (id) => {
    onNav(id);
    setSidebarOpen(false);   // close drawer on mobile after tap
  };

  return (
    <div className="app-shell">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay open"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-emblem">🎖️</div>
          <div>
            <div className="sidebar-title">NCC Portal</div>
            <div className="sidebar-subtitle">Attendance System</div>
          </div>
        </div>

        {/* User chip */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role" style={{ textTransform: "capitalize" }}>
                {user.role || "Cadet"}
              </div>
            </div>
          </div>
        )}

        {/* College selector (only when multiple colleges present) */}
        {colleges.length > 1 && (
          <div style={{ padding: "0 16px 12px" }}>
            <select
              value={activeCollege || ""}
              onChange={e => onCollegeChange?.(e.target.value)}
              disabled={loadingColleges}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
              }}
            >
              {colleges.map(c => (
                <option key={c.id} value={c.id} style={{ color: "#1e293b" }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav links */}
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-label">{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`nav-item${activeView === item.id ? " active" : ""}`}
                onClick={() => handleNav(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>

        {/* Footer / sign-out */}
        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={onLogout}
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <span className="nav-icon">⇥</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-content">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
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
                {user?.unit || "NCC Unit"} · {user?.role || "Cadet"}
              </div>
            </div>
            <div
              className="sidebar-avatar"
              style={{
                border: "2px solid var(--navy-200)",
                color: "var(--navy-700)",
                background: "var(--navy-50)",
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
