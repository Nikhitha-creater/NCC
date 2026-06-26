// src/components/UI.jsx  –  Shared design-system components

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = "md", color = "navy" }) {
  const sz = { sm: 16, md: 22, lg: 36 }[size];
  const stroke = color === "white" ? "#fff" : "var(--navy-700)";
  return (
    <svg
      width={sz} height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
      aria-label="Loading"
    >
      <path d="M12 2a10 10 0 0 1 10 10" opacity=".3" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export function FullPageLoader({ message = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <Spinner size="lg" />
      <p style={{ color: "var(--slate-500)", fontSize: 14 }}>{message}</p>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
export function Badge({ children, variant = "navy" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = "var(--navy-700)", icon, loading }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      {icon && <span className="stat-icon" aria-hidden>{icon}</span>}
      <div className="stat-label">{label}</div>
      {loading
        ? <div className="skeleton" style={{ width: 80, height: 36, marginTop: 4 }} />
        : <div className="stat-value">{value}</div>
      }
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────
export function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const cls = pct >= 75 ? "fill-high" : pct >= 60 ? "fill-medium" : "fill-low";
  return (
    <div className="progress-bar" title={`${pct}%`}>
      <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Attendance percentage display ─────────────────────────
export function PctBadge({ pct }) {
  const variant = pct >= 75 ? "success" : pct >= 60 ? "warning" : "danger";
  return <Badge variant={variant}>{pct}%</Badge>;
}

// ── Attendance circular ring ──────────────────────────────
export function AttendanceRing({ pct, size = 120 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--slate-200)" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: "var(--font-display)", fontSize: size * .22, fontWeight: 700, fill: color }}>
        {pct}%
      </text>
      <text x="50%" y="67%" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * .1, fill: "var(--slate-500)", fontFamily: "var(--font-body)" }}>
        ATTENDANCE
      </text>
    </svg>
  );
}

// ── Alert ─────────────────────────────────────────────────
export function Alert({ type = "info", children, onDismiss }) {
  const icons = { success: "✓", danger: "✕", warning: "⚠", info: "ℹ" };
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span style={{ fontWeight: 700 }}>{icons[type]}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", opacity: .6, fontSize: 16, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fadeIn" role="dialog" aria-modal aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm" aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────
export function EmptyState({ icon = "📋", title, message, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--navy-900)", marginBottom: 6 }}>{title}</div>
      {message && <div style={{ fontSize: 13, color: "var(--slate-500)", maxWidth: 300, margin: "0 auto" }}>{message}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--navy-900)", letterSpacing: ".3px" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ── Skeleton rows ──────────────────────────────────────────
export function SkeletonRows({ count = 5, cols = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? "80%" : "60%" }} /></td>
      ))}
    </tr>
  ));
}

// ── Event / parade card ────────────────────────────────────
export function EventCard({ event }) {
  const d = new Date(event.date || event.parade_date);
  const day   = isNaN(d) ? "—" : d.getDate();
  const month = isNaN(d) ? "" : d.toLocaleString("default", { month: "short" }).toUpperCase();

  return (
    <div className="event-item">
      <div className="event-date-box">
        <div className="event-day">{day}</div>
        <div className="event-month">{month}</div>
      </div>
      <div className="event-info">
        <div className="event-title">{event.title || event.name}</div>
        <div className="event-meta">
          {event.type && <span>{event.type}</span>}
          {event.location && <span> · {event.location}</span>}
          {event.time && <span> · {event.time}</span>}
        </div>
        {event.notes && <div className="event-meta" style={{ marginTop: 3, fontStyle: "italic" }}>{event.notes}</div>}
      </div>
      {event.type && (
        <Badge variant={
          event.type === "Camp Training" ? "olive" :
          event.type === "National Event" ? "gold" :
          "navy"
        }>{event.type}</Badge>
      )}
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────
export function Confirm({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
      </>
    }>
      <p style={{ fontSize: 14, color: "var(--slate-700)" }}>{message}</p>
    </Modal>
  );
}