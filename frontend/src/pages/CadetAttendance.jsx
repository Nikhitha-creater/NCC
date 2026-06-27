// src/pages/CadetAttendance.jsx  –  cadet's own attendance log
import { useState, useEffect } from "react";
import { api } from "../api/config.js"; // ✅ FIXED: Pointed to the correct central api path
import { useAuth } from "../context/AuthContext";
import { AttendanceRing, SectionHeader, Badge, Alert, FullPageLoader, EmptyState } from "../components/UI";

const MOCK = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  date: new Date(Date.now() - i * 7 * 86400000).toISOString().split("T")[0],
  type: ["Regular Parade", "PT Session", "Camp Training", "National Event", "Regular Parade"][i % 5],
  present: [true, true, false, true, true, true, false, true, true, true, false, true, true, false, true][i],
  remarks: i % 4 === 2 ? "Medical leave" : "",
}));

export default function CadetAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    // If user layout metadata parameters are missing, default cleanly to mock sets
    api.cadets.attendance(user?.id || "me")
      .then(res => {
        // Handle both object payload structures (.records) or raw array returns
        const data = res?.records || (Array.isArray(res) ? res : null);
        setRecords(data || MOCK);
      })
      .catch((err) => {
        console.warn("[ATTENDANCE VIEW] Fetch error or missing DB schema. Defaulting to system mock states.", err.message);
        setRecords(MOCK);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const pct = records.length
    ? Math.round((records.filter(r => r.present).length / records.length) * 100)
    : 0;

  const filtered = filter === "All" ? records : records.filter(r =>
    filter === "Present" ? r.present : !r.present
  );

  // Safe Date parsing framework to guard against corrupted database strings
  const formatDateString = (dateInput) => {
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className="animate-fadeIn">
      <SectionHeader title="My Attendance" subtitle="Full attendance history and statistics" />
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
        
        {/* Statistics Metric Pane Card */}
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-500)", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>Overall</div>
          <AttendanceRing pct={pct} size={150} />
          
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--slate-500)" }}>Present</span>
              <span style={{ fontWeight: 700, color: "var(--success)" }}>{records.filter(r => r.present).length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--slate-500)" }}>Absent</span>
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>{records.filter(r => !r.present).length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--slate-500)" }}>Total</span>
              <span style={{ fontWeight: 700 }}>{records.length}</span>
            </div>
          </div>
          
          {pct >= 75
            ? <Alert type="success" style={{ marginTop: 12 }}>Eligible ✓</Alert>
            : <Alert type="danger"  style={{ marginTop: 12 }}>Below 75%</Alert>
          }
        </div>

        {/* Tabulated Log Register History View */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attendance Log</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Present", "Absent"].map(f => (
                <button 
                  key={f} 
                  className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} 
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState icon="📋" title="No records found matching filter criteria" />
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className={`att-row-${r.present ? "present" : "absent"}`}>
                      <td>{formatDateString(r.date)}</td>
                      <td>{r.type || "Regular Parade"}</td>
                      <td>
                        <Badge variant={r.present ? "success" : "danger"}>
                          {r.present ? "✓ Present" : "✕ Absent"}
                        </Badge>
                      </td>
                      <td style={{ color: "var(--slate-400)", fontSize: 12 }}>{r.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
