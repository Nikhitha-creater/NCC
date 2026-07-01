// src/pages/CadetAttendance.jsx
import { useState, useEffect } from "react";
import { api } from "../api/config.js";
import { useAuth } from "../context/AuthContext";
import {
  FullPageLoader, SectionHeader, EmptyState,
  Badge, StatCard, ProgressBar, PctBadge, Alert, SkeletonRows,
} from "../components/UI";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SUMMARY = {
  attendanceRate: 86,
  totalParades: 28,
  attended: 24,
  absent: 4,
  threshold: 75,
};

const MOCK_RECORDS = [
  { id: 1,  date: "2026-06-28", type: "Regular Drill",     status: "present", remarks: "On time"           },
  { id: 2,  date: "2026-06-21", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 3,  date: "2026-06-14", type: "Firing Camp",       status: "present", remarks: "Best score – 48/60"},
  { id: 4,  date: "2026-06-07", type: "Regular Drill",     status: "absent",  remarks: "Medical leave"     },
  { id: 5,  date: "2026-05-31", type: "Map Reading Ex.",   status: "present", remarks: ""                  },
  { id: 6,  date: "2026-05-24", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 7,  date: "2026-05-17", type: "Physical Training", status: "absent",  remarks: "Unexcused"         },
  { id: 8,  date: "2026-05-10", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 9,  date: "2026-05-03", type: "Ceremonial Parade", status: "present", remarks: "Independence Day"  },
  { id: 10, date: "2026-04-26", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 11, date: "2026-04-19", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 12, date: "2026-04-12", type: "Regular Drill",     status: "absent",  remarks: "Medical leave"     },
  { id: 13, date: "2026-04-05", type: "Field Exercise",    status: "present", remarks: "Grade: Good"       },
  { id: 14, date: "2026-03-29", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 15, date: "2026-03-22", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 16, date: "2026-03-15", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 17, date: "2026-03-08", type: "Ceremonial Parade", status: "absent",  remarks: "Unexcused"         },
  { id: 18, date: "2026-03-01", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 19, date: "2026-02-22", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 20, date: "2026-02-15", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 21, date: "2026-02-08", type: "Map Reading Ex.",   status: "present", remarks: ""                  },
  { id: 22, date: "2026-02-01", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 23, date: "2026-01-25", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 24, date: "2026-01-18", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 25, date: "2026-01-11", type: "Ceremonial Parade", status: "present", remarks: "Republic Day camp" },
  { id: 26, date: "2026-01-04", type: "Regular Drill",     status: "present", remarks: ""                  },
  { id: 27, date: "2025-12-28", type: "Physical Training", status: "present", remarks: ""                  },
  { id: 28, date: "2025-12-21", type: "Regular Drill",     status: "present", remarks: ""                  },
];

const FILTER_OPTIONS = ["All", "Present", "Absent"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s) {
  const d = new Date(s);
  return isNaN(d)
    ? s
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMonth(s) {
  const d = new Date(s);
  return isNaN(d)
    ? s
    : d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function groupByMonth(records) {
  const map = {};
  records.forEach(r => {
    const key = r.date.slice(0, 7); // "YYYY-MM"
    if (!map[key]) map[key] = [];
    map[key].push(r);
  });
  // Sort descending
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CadetAttendance() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.attendance.summary().catch(() => null),
      api.attendance.list().catch(() => null),
    ]).then(([sumRes, recRes]) => {
      if (cancelled) return;
      setSummary(sumRes || MOCK_SUMMARY);
      setRecords(Array.isArray(recRes) && recRes.length ? recRes : MOCK_RECORDS);
    }).catch((err) => {
      console.warn("[CadetAttendance] Using mock data:", err.message);
      if (!cancelled) {
        setSummary(MOCK_SUMMARY);
        setRecords(MOCK_RECORDS);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <FullPageLoader message="Loading attendance records…" />;

  const sm = summary || MOCK_SUMMARY;
  const pct = sm.attendanceRate;
  const status = pct >= sm.threshold ? "On Track" : "Below Threshold";
  const statusVariant = pct >= sm.threshold ? "success" : "danger";

  const filtered = filter === "All"
    ? records
    : records.filter(r => r.status === filter.toLowerCase());

  const grouped = groupByMonth(filtered);

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      <SectionHeader
        title="My Attendance Register"
        subtitle={`${user?.name || "Cadet"} · ${user?.battalion || "7 TN BN NCC"}`}
      />

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatCard label="Attendance Rate" value={`${pct}%`}
                  sub={`Min required: ${sm.threshold}%`}
                  icon="📊" accent={pct >= sm.threshold ? "var(--success)" : "var(--danger)"} />
        <StatCard label="Parades Present" value={sm.attended}
                  sub={`of ${sm.totalParades} total`}
                  icon="✔" accent="var(--success)" />
        <StatCard label="Absences" value={sm.absent}
                  sub="This training year"
                  icon="✕" accent={sm.absent > 3 ? "var(--danger)" : "var(--warning)"} />
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <div className="stat-label">Standing</div>
          <div style={{ marginTop: 6 }}>
            <Badge variant={statusVariant}>{status}</Badge>
          </div>
          <div className="stat-sub" style={{ marginTop: 8 }}>
            <ProgressBar value={pct} max={100} />
          </div>
        </div>
      </div>

      {/* ── Filter buttons ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            className={`btn btn-sm ${filter === opt ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(opt)}
            style={{ borderRadius: 20 }}
          >
            {opt}
            {opt === "Present" && (
              <span style={{ marginLeft: 6, background: "rgba(255,255,255,.25)",
                             borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                {records.filter(r => r.status === "present").length}
              </span>
            )}
            {opt === "Absent" && (
              <span style={{ marginLeft: 6, background: "rgba(255,255,255,.25)",
                             borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                {records.filter(r => r.status === "absent").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Records grouped by month ── */}
      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No records" message={`No ${filter.toLowerCase()} records found.`} />
      ) : (
        grouped.map(([monthKey, monthRecords]) => (
          <div key={monthKey}>
            {/* Month header */}
            <div style={{
              fontSize: 12, fontWeight: 700, color: "var(--slate-400)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 10, paddingBottom: 8,
              borderBottom: "1px solid var(--slate-200)",
            }}>
              {fmtMonth(monthKey + "-01")}
              <span style={{ marginLeft: 10, fontWeight: 400 }}>
                ({monthRecords.filter(r => r.status === "present").length} / {monthRecords.length} present)
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--slate-50)" }}>
                    {["Date", "Activity Type", "Status", "Remarks"].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left", fontSize: 11,
                        fontWeight: 700, color: "var(--slate-500)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        borderBottom: "1px solid var(--slate-200)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "var(--slate-50)",
                        borderBottom: "1px solid var(--slate-100)",
                      }}
                    >
                      <td style={{ padding: "10px 14px", color: "var(--navy-800)", fontWeight: 600 }}>
                        {fmtDate(rec.date)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--slate-700)" }}>
                        {rec.type}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge variant={rec.status === "present" ? "success" : "danger"}>
                          {rec.status === "present" ? "Present" : "Absent"}
                        </Badge>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--slate-500)", fontStyle: rec.remarks ? "normal" : "italic" }}>
                        {rec.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
