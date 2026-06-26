// src/pages/MarkAttendance.jsx
import { useState, useEffect, useCallback } from "react";
import { api } from "../api/config";
import {
  Spinner, Alert, SectionHeader, Badge,
  EmptyState, FullPageLoader, SkeletonRows
} from "../components/UI";

const PARADE_TYPES = [
  "Regular Parade", "Camp Training", "National Event",
  "Republic Day Practice", "Independence Day Practice",
  "NIC Camp", "Annual Training Camp", "PT Session",
];

const MOCK_CADETS = Array.from({ length: 20 }, (_, i) => ({
  id: `c${i+1}`,
  name: ["Arjun Kumar", "Priya Nair", "Vikram Singh", "Divya Rao", "Suresh Patil",
         "Anita Sharma", "Rahul Verma", "Kavitha Reddy", "Mohan Das", "Shreya Joshi",
         "Aditya Patel", "Meena Krishnan", "Ravi Gupta", "Sunita Bhat", "Kiran Hegde",
         "Deepak Menon", "Pooja Iyer", "Sanjay Naik", "Rekha Pillai", "Ajay Kulkarni"][i],
  rank: ["Cadet","Cadet","Lance Corporal","Cadet","Corporal","Cadet","Lance Corporal","Cadet","Sergeant","Cadet",
         "Cadet","Lance Corporal","Cadet","Cadet","Corporal","Cadet","Cadet","Cadet","Lance Corporal","Under Officer"][i],
  roll_no: `KAR2024${String(i+1).padStart(3,"0")}`,
  wing: ["Army","Army","Air","Army","Navy","Army","Army","Air","Army","Navy",
         "Army","Army","Navy","Air","Army","Army","Navy","Army","Air","Army"][i],
}));

export default function MarkAttendance() {
  const today = new Date().toISOString().split("T")[0];

  const [cadets,      setCadets]      = useState([]);
  const [attendance,  setAttendance]  = useState({});   // { cadet_id: { present, remarks } }
  const [filter,      setFilter]      = useState("");
  const [paradeDate,  setParadeDate]  = useState(today);
  const [paradeType,  setParadeType]  = useState("Regular Parade");
  const [paradeTitle, setParadeTitle] = useState("");
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");

  // Load cadets
  useEffect(() => {
    api.cadets.list()
      .then(res => setCadets(res?.cadets || res || MOCK_CADETS))
      .catch(() => setCadets(MOCK_CADETS))
      .finally(() => setLoading(false));
  }, []);

  // Init attendance map when cadets load
  useEffect(() => {
    const init = {};
    cadets.forEach(c => { init[c.id] = { present: false, remarks: "" }; });
    setAttendance(init);
  }, [cadets]);

  const toggle = (id) => {
    setAttendance(a => ({ ...a, [id]: { ...a[id], present: !a[id]?.present } }));
  };

  const setRemark = (id, val) => {
    setAttendance(a => ({ ...a, [id]: { ...a[id], remarks: val } }));
  };

  const markAll = (present) => {
    const next = {};
    cadets.forEach(c => { next[c.id] = { ...attendance[c.id], present }; });
    setAttendance(next);
  };

  const presentCount = Object.values(attendance).filter(v => v.present).length;
  const pct = cadets.length ? Math.round((presentCount / cadets.length) * 100) : 0;

  const filtered = cadets.filter(c =>
    !filter || c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.roll_no?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!paradeDate) { setError("Please select a parade date."); return; }
    setSubmitting(true);
    setError(""); setSuccess("");
    try {
      const records = cadets.map(c => ({
        cadet_id: c.id,
        present:  attendance[c.id]?.present || false,
        remarks:  attendance[c.id]?.remarks || "",
      }));
      await api.attendance.mark({
        date:        paradeDate,
        type:        paradeType,
        title:       paradeTitle || `${paradeType} – ${paradeDate}`,
        records,
      });
      setSuccess(`Attendance saved! ${presentCount} present, ${cadets.length - presentCount} absent.`);
    } catch (err) {
      setError(err.message || "Failed to save attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader message="Loading cadet roll…" />;

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title="Mark Attendance"
        subtitle="Record cadet presence for today's parade or training session"
      />

      {success && <Alert type="success" onDismiss={() => setSuccess("")}>{success}</Alert>}
      {error   && <Alert type="danger"  onDismiss={() => setError("")}>{error}</Alert>}

      {/* Parade details */}
      <div className="card" style={{ marginBottom: 20, marginTop: (success || error) ? 16 : 0 }}>
        <div className="card-header"><span className="card-title">Parade Details</span></div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className="form-input" value={paradeDate} max={today}
                onChange={e => setParadeDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Parade Type <span className="required">*</span></label>
              <select className="form-select" value={paradeType} onChange={e => setParadeType(e.target.value)}>
                {PARADE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Event Title <span className="form-hint" style={{ display: "inline" }}>(optional)</span></label>
              <input type="text" className="form-input" placeholder="e.g. Founder's Day Parade"
                value={paradeTitle} onChange={e => setParadeTitle(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="card-title">Cadet Roll</span>
            <span style={{ fontSize: 12, color: "var(--slate-500)" }}>
              {presentCount} present · {cadets.length - presentCount} absent · {pct}% attendance
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text" className="form-input"
              placeholder="🔍 Search cadets…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 200 }}
            />
            <button className="btn btn-olive btn-sm" onClick={() => markAll(true)}>✓ Mark All Present</button>
            <button className="btn btn-ghost btn-sm"  onClick={() => markAll(false)}>✕ Clear All</button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: "8px 20px", background: "var(--slate-100)", borderBottom: "1px solid var(--slate-200)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--slate-500)", marginBottom: 4 }}>
            <span>Attendance Progress</span>
            <span style={{ fontWeight: 700, color: pct >= 75 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)" }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div
              className={`progress-fill ${pct >= 75 ? "fill-high" : pct >= 60 ? "fill-medium" : "fill-low"}`}
              style={{ width: `${pct}%`, transition: "width .3s" }}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th style={{ width: 52, textAlign: "center" }}>Present</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Rank</th>
                <th>Wing</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--slate-400)" }}>
                  No cadets match your search.
                </td></tr>
              )}
              {filtered.map(c => {
                const rec = attendance[c.id] || {};
                return (
                  <tr key={c.id} className={rec.present ? "att-row-present" : ""}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        className="att-checkbox"
                        checked={!!rec.present}
                        onChange={() => toggle(c.id)}
                        aria-label={`Mark ${c.name} present`}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--slate-500)" }}>{c.roll_no}</td>
                    <td>
                      <Badge variant={
                        c.rank === "Sergeant" || c.rank === "Under Officer" ? "gold" :
                        c.rank === "Corporal" || c.rank === "Lance Corporal" ? "navy" : "default"
                      }>{c.rank}</Badge>
                    </td>
                    <td>
                      <Badge variant={c.wing === "Army" ? "olive" : c.wing === "Air" ? "info" : "navy"}>{c.wing}</Badge>
                    </td>
                    <td>
                      <input
                        type="text" className="form-input"
                        placeholder="optional…"
                        value={rec.remarks || ""}
                        onChange={e => setRemark(c.id, e.target.value)}
                        style={{ padding: "5px 8px", fontSize: 12 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--slate-200)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "var(--slate-600)" }}>
            <strong style={{ color: "var(--navy-900)" }}>{presentCount}</strong> present ·{" "}
            <strong style={{ color: "var(--danger)" }}>{cadets.length - presentCount}</strong> absent ·{" "}
            <strong>{cadets.length}</strong> total cadets
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ minWidth: 160, justifyContent: "center" }}
          >
            {submitting ? <><Spinner size="sm" color="white" /> Saving…</> : "💾 Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}