// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner, Alert } from "../components/UI";

const DEMO_ACCOUNTS = [
  { label: "ANO / Admin", role: "admin", email: "ano@ncc.gov.in", password: "admin123" },
  { label: "Cadet",       role: "cadet", email: "cadet@ncc.gov.in", password: "cadet123" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "", role: "cadet" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await login({ email: form.email, password: form.password });
      const role = user?.role || form.role;
      navigate(role === "admin" || role === "ano" ? "/admin" : "/cadet", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password, role: account.role });
    setError("");
  };

  return (
    <div className="login-shell">
      {/* Left decorative panel */}
      <div className="login-panel-left">
        <div className="login-logo">🎖️</div>
        <h1 className="login-heading">National Cadet Corps</h1>
        <p className="login-tagline">Attendance Management System</p>

        <div className="login-pillars">
          {[
            { icon: "🎯", title: "Precision Tracking",   desc: "Real-time attendance across all parade types" },
            { icon: "🛡️", title: "Secure & Reliable",   desc: "JWT-secured access for cadets and officers" },
            { icon: "📊", title: "Instant Reports",      desc: "Exportable attendance reports in one click" },
          ].map(p => (
            <div className="login-pillar" key={p.title}>
              <div className="pillar-icon">{p.icon}</div>
              <div>
                <div style={{ fontWeight: 600, color: "rgba(255,255,255,.9)", fontSize: 14 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative rank stripes */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, display: "flex" }}>
          {["var(--navy-700)", "var(--gold-500)", "var(--olive-600)", "var(--gold-500)", "var(--navy-700)"].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-panel-right">
        <div className="login-form-header">
          <div className="login-form-title">Sign In</div>
          <div className="login-form-sub">Access your NCC portal account</div>
        </div>

        {error && (
          <Alert type="danger" onDismiss={() => setError("")} >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: error ? 16 : 0 }} noValidate>
          {/* Role toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "var(--slate-100)", borderRadius: "var(--radius-md)", padding: 4 }}>
            {[{ v: "cadet", label: "Cadet" }, { v: "admin", label: "ANO / Officer" }].map(r => (
              <button
                key={r.v} type="button"
                onClick={() => set("role", r.v)}
                style={{
                  flex: 1, padding: "8px 0", border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", transition: "all .15s",
                  background: form.role === r.v ? "var(--navy-900)" : "transparent",
                  color: form.role === r.v ? "white" : "var(--slate-600)",
                  boxShadow: form.role === r.v ? "var(--shadow-sm)" : "none",
                }}
              >
                {r.v === "cadet" ? "🎽 " : "🎖️ "}{r.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email / Service ID <span className="required">*</span>
            </label>
            <input
              id="email" type="email"
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password" type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => set("password", e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: "100%", marginTop: 8, justifyContent: "center" }}
          >
            {loading ? <><Spinner size="sm" color="white" /> Signing in…</> : "Sign In →"}
          </button>
        </form>

        <hr className="login-divider" />

        {/* Demo accounts */}
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 11.5, color: "var(--slate-500)", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
            Quick Demo Access
          </div>
          <div className="demo-pills">
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.role}
                className={`demo-pill demo-pill-${a.role === "admin" ? "admin" : "cadet"}`}
                onClick={() => fillDemo(a)}
              >
                {a.role === "admin" ? "🎖️" : "🎽"} {a.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 8 }}>
            Click to pre-fill credentials, then press Sign In.
          </p>
        </div>

        <p style={{ fontSize: 11, color: "var(--slate-400)", marginTop: "auto", paddingTop: 32, textAlign: "center" }}>
          National Cadet Corps · Attendance Portal v1.0<br />
          <span style={{ letterSpacing: "1px" }}>UNITY · DISCIPLINE · SELF-SACRIFICE</span>
        </p>
      </div>
    </div>
  );
}