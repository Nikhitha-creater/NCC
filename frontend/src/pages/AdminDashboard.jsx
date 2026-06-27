// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { api } from "../config";
import {
  StatCard, EventCard, FullPageLoader, Alert,
  SectionHeader, Badge, EmptyState, ProgressBar
} from "../components/UI";

const MOCK_STATS = {
  total_cadets: 84,
  present_today: 61,
  avg_attendance: 73,
  upcoming_parades: 3,
  below_75: 18,
  total_parades: 40,
};

const MOCK_RECENT_PARADES = [
  { id: 1, title: "Weekly Parade", date: new Date(Date.now() - 86400000).toISOString(), type: "Regular Parade", present: 58, total: 84 },
  { id: 2, title: "PT Session",    date: new Date(Date.now() - 4*86400000).toISOString(), type: "PT Session",    present: 71, total: 84 },
  { id: 3, title: "Republic Day Practice", date: new Date(Date.now() - 7*86400000).toISOString(), type: "National Event", present: 80, total: 84 },
];

const MOCK_UPCOMING = [
  { id: 1, title: "Weekly Parade",           date: new Date(Date.now() + 2*86400000).toISOString(),  type: "Regular Parade", location: "Parade Ground A" },
  { id: 2, title: "Republic Day Practice",   date: new Date(Date.now() + 7*86400000).toISOString(),  type: "National Event", location: "Central Ground" },
  { id: 3, title: "Annual Training Camp",    date: new Date(Date.now() + 14*86400000).toISOString(), type: "Camp Training",  location: "Camp Dharwad" },
];

const MOCK_LOW_ATT = [
  { id: "c1", name: "Pavan Kumar R",   rank: "Cadet",          pct: 55 },
  { id: "c2", name: "Divya Shetty",    rank: "Lance Corporal", pct: 60 },
  { id: "c3", name: "Suresh Nayak",    rank: "Cadet",          pct: 48 },
  { id: "c4", name: "Anitha Prasad",   rank: "Cadet",          pct: 62 },
];

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [recent,   setRecent]   = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [lowAtt,   setLowAtt]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, paradesRes] = await Promise.allSettled([
          api.stats.unit(),
          api.parades.upcoming(),
        ]);
        setStats(statsRes.status === "fulfilled" ? statsRes.value : MOCK_STATS);
        setUpcoming(paradesRes.status === "fulfilled" ? (paradesRes.value?.parades || paradesRes.value || []) : MOCK_UPCOMING);
        try {
          const rpt = await api.attendance.report({ limit: 3, sort: "desc" });
          setRecent(rpt?.records || rpt || MOCK_RECENT_PARADES);
        } catch { setRecent(MOCK_RECENT_PARADES); }
        try {
          const low = await api.cadets.list({ below_pct: 75 });
          setLowAtt(low?.cadets || low || MOCK_LOW_ATT);
        } catch { setLowAtt(MOCK_LOW_ATT); }
      } catch {
        setStats(MOCK_STATS); setRecent(MOCK_RECENT_PARADES);
        setUpcoming(MOCK_UPCOMING); setLowAtt(MOCK_LOW_ATT);
        setError("Could not reach server – showing demo data.");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <FullPageLoader message="Loading unit overview…" />;

  const presentPct = stats ? Math.round((stats.present_today / stats.total_cadets) * 100) : 0;

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title="Unit Overview"
        subtitle={`Today: ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      />

      {error && <Alert type="warning" onDismiss={() => setError("")}>{error}</Alert>}

      {/* Stats */}
      <div className="stat-grid" style={{ marginTop: error ? 16 : 0 }}>
        <StatCard label="Total Cadets"       value={stats?.total_cadets || 0}    sub="enrolled this cycle"         accent="var(--navy-700)"  icon="👥" />
        <StatCard label="Present Today"      value={stats?.present_today || 0}   sub={`${presentPct}% of strength`} accent="var(--success)"   icon="✔" />
        <StatCard label="Avg Attendance"     value={`${stats?.avg_attendance || 0}%`} sub="unit average"          accent={stats?.avg_attendance >= 75 ? "var(--success)" : "var(--warning)"} icon="📊" />
        <StatCard label="Below 75%"          value={stats?.below_75 || 0}        sub="cadets need attention"       accent="var(--danger)"    icon="⚠" />
      </div>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Upcoming parades */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming Events</span>
            <Badge variant="navy">{upcoming.length}</Badge>
          </div>
          <div className="card-body">
            {upcoming.length === 0
              ? <EmptyState icon="📅" title="No upcoming events" />
              : <div className="event-list">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
            }
          </div>
        </div>

        {/* Cadets needing attention */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attendance Alerts</span>
            <Badge variant="danger">{lowAtt.length} cadets</Badge>
          </div>
          <div className="card-body">
            {lowAtt.length === 0
              ? <EmptyState icon="✅" title="All cadets above threshold" />
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lowAtt.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--slate-200)" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "var(--danger-bg)", color: "var(--danger)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, flexShrink: 0
                      }}>
                        {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--slate-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--slate-500)" }}>{c.rank}</div>
                        <div style={{ marginTop: 4 }}><ProgressBar value={c.pct} /></div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.pct < 60 ? "var(--danger)" : "var(--warning)", flexShrink: 0 }}>{c.pct}%</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Recent parades */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Parade Summary</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parade / Event</th>
                <th>Date</th>
                <th>Type</th>
                <th>Present</th>
                <th>Attendance %</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => {
                const pct = r.present && r.total ? Math.round((r.present / r.total) * 100) : (r.attendance_pct || 0);
                return (
                  <tr key={r.id || i}>
                    <td>{r.title || r.name}</td>
                    <td style={{ color: "var(--slate-500)" }}>
                      {r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td><Badge variant="navy">{r.type || "—"}</Badge></td>
                    <td>{r.present ?? "—"} / {r.total || stats?.total_cadets || "—"}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: pct >= 75 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)" }}>
                        {pct}%
                      </span>
                    </td>
                    <td style={{ width: 120 }}><ProgressBar value={pct} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}