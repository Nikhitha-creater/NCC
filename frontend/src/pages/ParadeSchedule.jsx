// src/pages/ParadeSchedule.jsx
import { useState, useEffect } from "react";
import { api } from "../api/config.js";
import { useAuth } from "../context/AuthContext";
import {
  FullPageLoader, SectionHeader, EmptyState, Badge, Alert,
} from "../components/UI";

// ── Mock data ─────────────────────────────────────────────────────────────────
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
    notes: "Bring compass, protractor, and 1:50,000 map sheet.",
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
    notes: "10-day residential camp. Registration closes 10 July.",
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
    uniform: "Full Ceremonial with Medals",
    type: "National Event",
    status: "upcoming",
    notes: "State-level parade. Selected cadets only.",
  },
  {
    id: 7,
    title: "Thal Sainik Camp (TSC) 2026",
    date: "2026-11-10",
    time: "All day",
    location: "Army Camp, Delhi Cantt",
    uniform: "Full Ceremonial Kit",
    type: "Camp Training",
    status: "upcoming",
    notes: "3 seats available. Apply through ANO.",
  },
  {
    id: 8,
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
    id: 9,
    title: "Firing Camp – .22 Rifle Practice",
    date: "2026-06-14",
    time: "07:00 hrs",
    location: "NCC Firing Range, Vellore",
    uniform: "Khaki Drill",
    type: "Camp Training",
    status: "completed",
    notes: "Results uploaded to ANO office.",
  },
  {
    id: 10,
    title: "Combined Annual Training Camp (CATC)",
    date: "2026-05-20",
    time: "05:00 hrs",
    location: "Air Force Station, Tambaram",
    uniform: "Full Ceremonial Kit",
    type: "Camp Training",
    status: "completed",
    notes: "7-day residential camp. Completed successfully.",
  },
];

const FILTERS = ["All", "Upcoming", "Completed", "Camps"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyFilter(events, f) {
  switch (f) {
    case "Upcoming":  return events.filter(e => e.status === "upcoming");
    case "Completed": return events.filter(e => e.status === "completed");
    case "Camps":     return events.filter(e => e.type === "Camp Training");
    default:          return events;
  }
}

function accentColor(event) {
  if (event.status === "completed") return "var(--slate-300)";
  if (event.type === "Camp Training")  return "var(--olive, #7c8c4a)";
  if (event.type === "National Event") return "#c9a84c";
  return "var(--navy-500)";
}

function statusVariant(s) {
  return s === "upcoming" ? "navy" : s === "completed" ? "success" : s === "postponed" ? "warning" : "danger";
}

function typeVariant(t) {
  return t === "Camp Training" ? "olive" : t === "National Event" ? "gold" : t === "Selection Trial" ? "warning" : "navy";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ParadeSchedule() {
  const { user } = useAuth();

  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.parades.list()
      .then((res) => {
        if (!cancelled)
          setEvents(Array.isArray(res) && res.length ? res : MOCK_EVENTS);
      })
      .catch((err) => {
        console.warn("[ParadeSchedule] Backend offline, using mock data:", err.message);
        if (!cancelled) setEvents(MOCK_EVENTS);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <FullPageLoader message="Loading parade schedule…" />;

  const upcomingCount  = events.filter(e => e.status === "upcoming").length;
  const completedCount = events.filter(e => e.status === "completed").length;
  const filtered       = applyFilter(events, filter);

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <SectionHeader
        title="Parade & Training Schedule"
        subtitle={`${upcomingCount} upcoming · ${completedCount} completed this year`}
      />

      {/* ── Filter pills ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map(opt => (
          <button
            key={opt}
            className={`btn btn-sm ${filter === opt ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(opt)}
            style={{ borderRadius: 20 }}
          >
            {opt}
            {opt === "Upcoming" && (
              <span style={{ marginLeft: 6, background: "rgba(255,255,255,.25)",
                             borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                {upcomingCount}
              </span>
            )}
            {opt === "Completed" && (
              <span style={{ marginLeft: 6, background: "rgba(255,255,255,.25)",
                             borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                {completedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Event list ── */}
      {filtered.length === 0 ? (
        <EmptyState icon="📅" title="No events"
                    message={`No ${filter.toLowerCase()} events found.`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(event => {
            const d         = new Date(event.date);
            const day       = isNaN(d) ? "—" : d.getDate();
            const month     = isNaN(d) ? "" : d.toLocaleString("en-IN", { month: "short" }).toUpperCase();
            const completed = event.status === "completed";

            return (
              <div
                key={event.id}
                className="card"
                style={{
                  padding: "20px 24px",
                  opacity: completed ? 0.78 : 1,
                  borderLeft: `4px solid ${accentColor(event)}`,
                }}
              >
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

                  {/* Date box */}
                  <div style={{
                    background: completed ? "var(--slate-100)" : "var(--navy-50)",
                    border: `1px solid ${completed ? "var(--slate-200)" : "var(--navy-200)"}`,
                    borderRadius: 10, padding: "12px 16px",
                    textAlign: "center", minWidth: 58, flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize: 24, fontWeight: 800,
                      fontFamily: "var(--font-display)",
                      color: completed ? "var(--slate-500)" : "var(--navy-800)",
                      lineHeight: 1,
                    }}>{day}</div>
                    <div style={{ fontSize: 10, color: "var(--slate-400)",
                                  textTransform: "uppercase", marginTop: 2 }}>{month}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8,
                                  alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-900)" }}>
                        {event.title}
                      </span>
                      <Badge variant={statusVariant(event.status)}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                      <Badge variant={typeVariant(event.type)}>{event.type}</Badge>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px",
                                  fontSize: 13, color: "var(--slate-600)",
                                  marginBottom: event.notes ? 10 : 0 }}>
                      <span>🕐 {event.time}</span>
                      <span>📍 {event.location}</span>
                      <span>👕 <strong>Uniform:</strong> {event.uniform}</span>
                    </div>

                    {event.notes && (
                      <div style={{
                        marginTop: 10, padding: "8px 12px",
                        background: "var(--slate-50)",
                        borderRadius: 6, fontSize: 12,
                        color: "var(--slate-500)", fontStyle: "italic",
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
