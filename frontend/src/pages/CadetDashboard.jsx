// src/pages/CadetDashboard.jsx
import { useState, useEffect } from "react";
import { api } from "../config";
import { useAuth } from "../context/AuthContext";
import {
  StatCard, AttendanceRing, ProgressBar, PctBadge,
  EventCard, FullPageLoader, Alert, EmptyState, SectionHeader, Badge
} from "../components/UI";

const MOCK_STATS = {
  attendance_pct: 78,
  parades_attended: 31,
  parades_total: 40,
  total_hours: 186,
  rank: "Lance Corporal",
  regiment: "1 Karnataka Battalion",
  service_no: "KAR-2024-0042",
};

const MOCK_UPCOMING = [
  { id: 1, title: "Weekly Parade",           date: new Date(Date.now() + 2*86400000).toISOString(), type: "Regular Parade",    location: "Parade Ground A", time: "0600 hrs" },
  { id: 2, title: "Republic Day Practice",   date: new Date(Date.now() + 7*86400000).toISOString(), type: "National Event",    location: "Central Ground",  time: "0530 hrs" },
  { id: 3, title: "Annual Training Camp",    date: new Date(Date.now() + 14*86400000).toISOString(),type: "Camp Training",     location: "Camp Dharwad",    time: "All Day" },
  { id: 4, title: "Physical Training",       date: new Date(Date.now() + 3*86400000).toISOString(), type: "PT Session",        location: "Sports Ground",   time: "0530 hrs" },
];

const MOCK_RECENT = [
  { date: "2025-01-10", type: "Regular Parade",   status: "present" },
  { date: "2025-01-07", type: "PT Session",        status: "present" },
  { date: "2025-01-03", type: "Camp Training",     status: "absent"  },
  { date: "2024-12-27", type: "Regular Parade",    status: "present" },
  { date: "2024-12-20", type: "National Event",    status: "present" },
  { date: "2024-12-13", type: "Regular Parade",    status: "absent"  },
];

export default function CadetDashboard() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, paradesRes] = await Promise.allSettled([
          api.stats.cadet(user?.id || "me"),
          api.parades.upcoming(),
        ]);

        setStats(statsRes.status === "fulfilled" ? statsRes.value : MOCK_STATS);
        setUpcoming(paradesRes.status === "fulfilled" ? (paradesRes.value?.parades || paradesRes.value || []) : MOCK_UPCOMING);

        try {
          const attRes = await api.cadets.attendance(user?.id || "me");
          setRecent(attRes?.records || attRes || []);
        } catch {
          setRecent(MOCK_RECENT);
        }
      } catch {
        setStats(MOCK_STATS);
        setUpcoming(MOCK_UPCOMING);
        setRecent(MOCK_RECENT);
        setError("Could not connect to server – showing cached data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <FullPageLoader message="Loading your dashboard…" />;

  const pct = stats?.attendance_pct ?? 0;

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title={`Welcome, ${user?.name?.split(" ")[0] || "Cadet"}`}
        subtitle={`${stats?.regiment || "NCC Unit"} · ${stats?.service_no || ""}`}
      />

      {error && <Alert type="warning" onDismiss={() => setError("")}>{error}</Alert>}

      {/* Stat row */}
      <div className="stat-grid" style={{ marginTop: error ? 16 : 0 }}>
        <StatCard
          label="Attendance"
          value={`${pct}%`}
          sub={`${stats?.parades_attended || 0} / ${stats?.parades_total || 0} parades`}
          accent={pct >= 75 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)"}
          icon="✔"
        />
        <StatCard
          label="Training Hours"
          value={stats?.total_hours || 0}
          sub="total hours logged"
          accent="var(--navy-700)"
          icon="⏱"
        />
        <StatCard
          label="Rank"
          value={stats?.rank || "Cadet"}
          sub="current designation"
          accent="var(--gold-500)"
          icon="🎖"
        />
        <StatCard
          label="Parades This Month"
          value={stats?.parades_this_month || Math.floor((stats?.parades_total || 0) / 6)}
          sub="attended vs scheduled"
          accent="var(--olive-600)"
          icon="📋"
        />
      </div>

      {/* Main content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, alignItems: "start" }}>

        {/* Attendance ring */}
        <div className="card" style={{ width: 200, padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 12, fontSize: 13 }}>YOUR ATTENDANCE</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AttendanceRing pct={pct} size={150} />
          </div>
          <div style={{ marginTop: 12 }}>
            {pct >= 75
              ? <Alert type="success">✓ Eligible for all activities</Alert>
              : pct >= 60
              ? <Alert type="warning">Below 75% – improve attendance</Alert>
              : <Alert type="danger">Critical – attend immediately</Alert>
            }
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming Parades & Training</span>
            <Badge variant="navy">{upcoming.length} events</Badge>
          </div>
          <div className="card-body">
            {upcoming.length === 0
              ? <EmptyState icon="📅" title="No upcoming events" message="Check back later for scheduled parades." />
              : <div className="event-list">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
            }
          </div>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Recent Attendance Record</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Parade / Event Type</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--slate-400)", padding: 32 }}>No records found.</td></tr>
                : recent.map((r, i) => (
                  <tr key={i} className={`att-row-${r.status || (r.present ? "present" : "absent")}`}>
                    <td>{new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td>{r.type || r.parade_type || "Parade"}</td>
                    <td>
                      <Badge variant={r.status === "present" || r.present ? "success" : "danger"}>
                        {r.status === "present" || r.present ? "✓ Present" : "✕ Absent"}
                      </Badge>
                    </td>
                    <td style={{ color: "var(--slate-400)", fontSize: 12 }}>{r.remarks || "—"}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Physical training schedule */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Physical Training Schedule</span>
          <Badge variant="olive">Weekly</Badge>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {[
              { day: "Monday",    activity: "Running – 5km", time: "05:30", intensity: "high" },
              { day: "Wednesday", activity: "Drill Practice", time: "06:00", intensity: "medium" },
              { day: "Thursday",  activity: "Strength Training", time: "05:30", intensity: "high" },
              { day: "Saturday",  activity: "Parade Practice", time: "06:00", intensity: "medium" },
              { day: "Sunday",    activity: "Rest / Recovery", time: "—", intensity: "low" },
            ].map(t => (
              <div key={t.day} style={{
                padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--slate-200)",
                background: t.intensity === "high" ? "rgba(30,58,120,.04)" : t.intensity === "low" ? "var(--slate-100)" : "white",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: ".8px" }}>{t.day}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-900)", marginTop: 4, lineHeight: 1.3 }}>{t.activity}</div>
                <div style={{ fontSize: 11.5, color: "var(--slate-500)", marginTop: 4 }}>⏰ {t.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}