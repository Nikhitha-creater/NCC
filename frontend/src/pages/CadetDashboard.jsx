// src/pages/CadetDashboard.jsx
import { useState, useEffect } from "react";
import { api } from "../api/config.js";
import { useAuth } from "../context/AuthContext";
import {
  FullPageLoader, SectionHeader, EmptyState,
  Badge, StatCard, AttendanceRing, Alert,
} from "../components/UI";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_STATS = {
  attendanceRate: 86,
  totalParades: 28,
  attended: 24,
  nextDrill: {
    title: "Regular Drill & Weapon Training",
    date: "2026-07-05",
    time: "06:30 hrs",
    uniform: "Rifles / Khaki Drill",
    location: "Main Parade Ground",
  },
};

const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Annual Training Camp (ATC) 2026 – Registration Open",
    body: "All cadets interested in ATC 2026 at Pune must submit forms to the ANO by 10 July. Medical fitness certificate is mandatory.",
    priority: "high",
    date: "2026-07-01",
    from: "Commanding Officer",
    read: false,
  },
  {
    id: 2,
    title: "Republic Day Camp Selection – Trials on 12 July",
    body: "RDC selection trials on 12 July at 05:30 hrs. Compulsory for all SD cadets above Lance Corporal rank.",
    priority: "high",
    date: "2026-06-29",
    from: "ANO",
    read: false,
  },
  {
    id: 3,
    title: "Uniform Inspection – Next Parade",
    body: "Full ceremonial uniform with polished boots and cap badge will be inspected at the next parade. Defaulters will be noted in the record book.",
    priority: "normal",
    date: "2026-06-27",
    from: "Under Officer",
    read: true,
  },
  {
    id: 4,
    title: "NCC Day Celebration – 21 November",
    body: "Preparations for NCC Day have commenced. Cultural programme volunteers should report to the Senior Under Officer by this weekend.",
    priority: "normal",
    date: "2026-06-24",
    from: "Senior Under Officer",
    read: true,
  },
  {
    id: 5,
    title: "Thal Sainik Camp (TSC) Quota Released",
    body: "Our unit has 3 seats for TSC 2026. Eligible SD cadets with B Certificate and above may apply via the ANO before 15 July.",
    priority: "low",
    date: "2026-06-20",
    from: "ANO",
    read: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s) {
  const d = new Date(s);
  return isNaN(d)
    ? s
    : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function priorityColor(p) {
  return p === "high" ? "var(--danger)" : p === "normal" ? "var(--navy-500)" : "var(--olive, #7c8c4a)";
}

function priorityVariant(p) {
  return p === "high" ? "danger" : p === "normal" ? "navy" : "olive";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CadetDashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || "Cadet").split(" ")[0];

  const [stats,         setStats]         = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [readIds,       setReadIds]       = useState(
    () => new Set(MOCK_ANNOUNCEMENTS.filter(a => a.read).map(a => a.id))
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.attendance.summary().catch(() => null),
      api.announcements.list().catch(() => null),
    ]).then(([statsRes, annoRes]) => {
      if (cancelled) return;
      setStats(statsRes || MOCK_STATS);
      setAnnouncements(Array.isArray(annoRes) && annoRes.length ? annoRes : MOCK_ANNOUNCEMENTS);
    }).catch((err) => {
      console.warn("[CadetDashboard] Using mock data:", err.message);
      if (!cancelled) {
        setStats(MOCK_STATS);
        setAnnouncements(MOCK_ANNOUNCEMENTS);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const unread   = announcements.filter(a => !readIds.has(a.id)).length;

  if (loading) return <FullPageLoader message="Loading your dashboard…" />;

  const nd = stats?.nextDrill || MOCK_STATS.nextDrill;
  const drillDate = new Date(nd.date);

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Welcome banner ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)",
        borderRadius: 14, padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12,
                        letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 6 }}>
            Welcome back
          </div>
          <h1 style={{ color: "#fff", fontSize: 28, fontFamily: "var(--font-display)",
                       fontWeight: 700, margin: 0 }}>
            {firstName} 🎖️
          </h1>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
            {user?.unit || "NCC Unit"} · {user?.battalion || "7 TN BN NCC"}
          </div>
        </div>
        <AttendanceRing pct={stats?.attendanceRate ?? MOCK_STATS.attendanceRate} size={110} />
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard
          label="Attendance Rate"
          value={`${stats?.attendanceRate ?? MOCK_STATS.attendanceRate}%`}
          sub={`${stats?.attended ?? MOCK_STATS.attended} of ${stats?.totalParades ?? MOCK_STATS.totalParades} parades`}
          icon="📊" accent="var(--navy-700)"
        />
        <StatCard
          label="Parades Attended"
          value={stats?.attended ?? MOCK_STATS.attended}
          sub="This training year"
          icon="✔" accent="var(--success)"
        />
        <StatCard
          label="Pending Notices"
          value={unread}
          sub="Unread orders"
          icon="📋"
          accent={unread > 0 ? "var(--warning)" : "var(--slate-400)"}
        />
      </div>

      {/* ── Next drill ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-400)",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Next Scheduled Drill
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{
            background: "var(--navy-50)", border: "1px solid var(--navy-200)",
            borderRadius: 10, padding: "14px 20px", textAlign: "center",
            minWidth: 68, flexShrink: 0,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--navy-800)",
                          fontFamily: "var(--font-display)", lineHeight: 1 }}>
              {isNaN(drillDate) ? "—" : drillDate.getDate()}
            </div>
            <div style={{ fontSize: 10, color: "var(--slate-400)", textTransform: "uppercase", marginTop: 2 }}>
              {isNaN(drillDate) ? "" : drillDate.toLocaleString("en-IN", { month: "short" })}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy-900)", marginBottom: 8 }}>
              {nd.title}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px",
                          fontSize: 13, color: "var(--slate-600)" }}>
              <span>🕐 {nd.time}</span>
              <span>📍 {nd.location}</span>
              <span>👕 {nd.uniform}</span>
            </div>
          </div>
          <Badge variant="success">Confirmed</Badge>
        </div>
      </div>

      {/* ── Announcements ── */}
      <div>
        <SectionHeader
          title="Orders of the Day"
          subtitle="Notices and orders from your commanding officers"
        />
        {announcements.length === 0 ? (
          <EmptyState icon="📋" title="No announcements" message="All clear — no orders at this time." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.map(ann => {
              const isRead = readIds.has(ann.id);
              return (
                <div
                  key={ann.id}
                  className="card"
                  style={{
                    padding: "18px 22px",
                    borderLeft: `4px solid ${isRead ? "var(--slate-200)" : priorityColor(ann.priority)}`,
                    opacity: isRead ? 0.72 : 1,
                    transition: "opacity .2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start",
                                justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8,
                                    flexWrap: "wrap", marginBottom: 6 }}>
                        {!isRead && (
                          <span style={{ width: 7, height: 7, borderRadius: "50%",
                                         background: "var(--danger)", display: "inline-block",
                                         flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-900)" }}>
                          {ann.title}
                        </span>
                        <Badge variant={priorityVariant(ann.priority)}>
                          {ann.priority === "high" ? "Priority" : ann.priority === "normal" ? "Notice" : "Info"}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--slate-600)",
                                  margin: "0 0 10px", lineHeight: 1.65 }}>
                        {ann.body}
                      </p>
                      <div style={{ fontSize: 11, color: "var(--slate-400)" }}>
                        From <strong>{ann.from}</strong> · {fmtDate(ann.date)}
                      </div>
                    </div>
                    {!isRead && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => markRead(ann.id)}
                        style={{ flexShrink: 0, fontSize: 12 }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
