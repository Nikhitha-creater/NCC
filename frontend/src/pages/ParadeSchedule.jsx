// src/pages/ParadeSchedule.jsx
import { useState, useEffect } from "react";
import { api } from "../api/config.js";
import { useAuth } from "../context/AuthContext";
import {
  FullPageLoader,
  SectionHeader,
  EmptyState,
  Badge,
  Alert,
} from "../components/UI";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: 1,
    title: "Regular Drill & Weapon Training",
    date: "2026-07-05",
    time: "06:30 hrs",
    location: "Main Parade Ground, VIT Vellore",
    uniform: "Rifles / Khaki Drill",
    type: "Regular Drill",
    status: "upcoming",
    notes: "Weapon handling drill. All SD cadets must carry service records.",
  },
  {
    id: 2,
    title: "Physical Training & Cross-Country Run",
    date: "2026-07-12",
    time: "05:45 hrs",
    location: "Athletics Track, VIT Campus",
    uniform: "PT Rig",
    type: "Physical Training",
    status: "upcoming",
    notes: "5 km cross-country. Attendance mandatory for RDC aspirants.",
  },
  {
    id: 3,
    title: "Map Reading & Field Craft Exercise",
    date: "2026-07-19",
    time: "07:00 hrs",
    location: "Open Field, Katpadi Training Area",
    uniform: "Combat / DPM",
    type: "Field Exercise",
    status: "upcoming",
    notes: "Bring compass, protractor, and 1:50,000 topographic map sheet.",
  },
  {
    id: 4,
    title: "Annual Training Camp (ATC) 2026",
    date: "2026-08-02",
    time: "05:00 hrs",
    location: "NCC Training Academy, Pune",
    uniform: "Full Ceremonial Kit",
    type: "Camp Training",
    status: "upcoming",
    notes: "10-day residential camp. Registration deadline: 10 July.",
  },
  {
    id: 5,
    title: "Republic Day Camp (RDC) Selection Trials",
    date: "2026-07-25",
    time: "05:30 hrs",
    location: "Main Parade Ground, VIT Vellore",
    uniform: "Khaki Drill",
    type: "Selection Trial",
    status: "upcoming",
    notes: "Open to SD cadets, Lance Corporal and above.",
  },
  {
    id: 6,
    title: "Independence Day Parade Rehearsal",
    date: "2026-08-09",
    time: "06:00 hrs",
    location: "District Parade Ground, Vellore",
    uniform: "Full Ceremonial with Awards",
    type: "National Event",
    status: "upcoming",
    notes: "State-level parade. Selected cadets only.",
  },
  {
    id: 7,
    title: "Regular Drill – Ceremonial Movements",
    date: "2026-06-28",
    time: "06:30 hrs",
    location: "Main Parade Ground, VIT Vellore",
    uniform: "Khaki Drill",
    type: "Regular Drill",
    status: "completed",
    notes: "",
  },
  {
    id: 8,
    title: "Firing Camp – .22 Rifle Firing",
    date: "2026-06-14",
    time: "07:00 hrs",
    location: "NCC Firing Range, Vellore",
    uniform: "Khaki Drill",
    type: "Camp Training",
    status: "completed",
    notes: "Firing practice completed. Results uploaded to ANO.",
  },
  {
    id: 9,
    title: "Thal Sainik Camp (TSC) 2026",
    date: "2026-11-10",
    time: "All day",
    location: "Army Camp, Delhi Cantt",
    uniform: "Full Ceremonial Kit",
    type: "Camp Training",
    status: "upcoming",
    notes: "Only 3 seats available. Apply through ANO.",
  },
];

const FILTER_OPTIONS = ["All", "Upcoming", "Completed", "Camps"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function statusVariant(s) {
  switch (s) {
    case "upcoming":   return "navy";
    case "completed":  return "success";
    case "postponed":  return "warning";
    case "cancelled":  return "danger";
    default:           return "navy";
  }
}

function typeVariant(t) {
  switch (t) {
    case "Camp Training":   return "olive";
    case "National Event":  return "gold";
    case "Selection Trial": return "warning";
    default:                return "navy";
  }
}

function applyFilter(events, filter) {
  switch (filter) {
    case "Upcoming":  return events.filter(e => e.status === "upcoming");
    case "Completed": return events.filter(e => e.status === "completed");
    case "Camps":     return events.filter(e => e.type === "Camp Training");
    default:          return events;
  }
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ParadeSchedule() {
  const { user } = useAuth();

  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.parades?.list?.()
      .then((res) => {
        setEvents(res?.length ? res : MOCK_EVENTS);
      })
      .catch((err) => {
        console.warn("[ParadeSchedule] API unavailable, using mock data:", err);
        setEvents(MOCK_EVENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader message="Loading parade schedule…" />;

  const filtered = applyFilter(events, filter);
  const upcomingCount  = events.filter(e => e.status === "upcoming").length;
  const completedCount = events.filter(e => e.status === "completed").length;

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <SectionHeader
        title="Parade & Training Schedule"
        subtitle={`${upcomingCount} upcoming · ${completedCount} completed this year`}
      />

      {error && <Alert type="warning" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* ── Filter Controls ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            className={`btn btn-sm ${filter === opt ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(opt)}
            style={{ borderRadius: 20 }}
          >
            {opt}
            {opt === "Upcoming"  && <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{upcomingCount}</span>}
            {opt === "Completed" && <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{completedCount}</span>}
          </button>
        ))}
      </div>

      {/* ── Event List ── */}
      {filtered.length === 0 ? (
        <EmptyState icon="📅" title="No events" message={`No ${filter.toLowerCase()} events found.`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(event => {
            const d = new Date(event.date);
            const day   = isNaN(d) ? "—" : d.getDate();
            const month = isNaN(d) ? "" : d.toLocaleString("en-IN", { month: "short" }).toUpperCase();
            const isCompleted = event.status === "completed";

            return (
              <div
                key={event.id}
                className="card"
                style={{
                  padding: "20px 24px",
                  opacity: isCompleted ? 0.75 : 1,
                  borderLeft: `4px solid ${
                    isCompleted          ? "var(--slate-300)"
                    : event.type === "Camp Training"  ? "var(--olive)"
                    : event.type === "National Event" ? "var(--gold, #c9a84c)"
                    : "var(--navy-500)"
                  }`,
                }}
              >
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

                  {/* Date Box */}
                  <div style={{
                    background: isCompleted ? "var(--slate-100)" : "var(--navy-50)",
                    border: `1px solid ${isCompleted ? "var(--slate-200)" : "var(--navy-200)"}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    textAlign: "center",
                    minWidth: 60,
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize: 24,
                      fontWeight: 800,
                      fontFamily: "var(--font-display)",
                      color: isCompleted ? "var(--slate-500)" : "var(--navy-800)",
                      lineHeight: 1,
                    }}>{day}</div>
                    <div style={{ fontSize: 10, color: "var(--slate-400)", textTransform: "uppercase", marginTop: 2 }}>{month}</div>
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--navy-900)" }}>{event.title}</span>
                      <Badge variant={statusVariant(event.status)}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                      <Badge variant={typeVariant(event.type)}>{event.type}</Badge>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", fontSize: 13, color: "var(--slate-600)", marginBottom: event.notes ? 10 : 0 }}>
                      <span>🕐 {event.time}</span>
                      <span>📍 {event.location}</span>
                      <span>👕 <strong>Uniform:</strong> {event.uniform}</span>
                    </div>

                    {event.notes && (
                      <div style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        background: "var(--slate-50)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--slate-500)",
                        fontStyle: "italic",
                        border: "1px solid var(--slate-200)",
                      }}>
                        📌 {event.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
