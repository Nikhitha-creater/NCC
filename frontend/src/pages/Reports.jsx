// src/pages/Reports.jsx
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { api, downloadCSV } from "../api/config";
import {
  SectionHeader, StatCard, Badge, Alert,
  FullPageLoader, ProgressBar, EmptyState
} from "../components/UI";

const MOCK_MONTHLY = [
  { month: "Aug", avg_pct: 81, parades: 6 },
  { month: "Sep", avg_pct: 74, parades: 8 },
  { month: "Oct", avg_pct: 88, parades: 7 },
  { month: "Nov", avg_pct: 79, parades: 9 },
  { month: "Dec", avg_pct: 71, parades: 5 },
  { month: "Jan", avg_pct: 76, parades: 5 },
];

const MOCK_CADETS = Array.from({ length: 10 }, (_, i) => ({
  id: `c${i+1}`,
  name: ["Arjun Kumar","Priya Nair","Vikram Singh","Divya Rao","Suresh Patil","Anita Sharma","Rahul Verma","Kavitha Reddy","Mohan Das","Shreya Joshi"][i],
  roll_no: `KAR2024${String(i+1).padStart(3,"0")}`,
  rank: ["Cadet","Cadet","Lance Corporal","Cadet","Corporal","Cadet","Lance Corporal","Cadet","Sergeant","Cadet"][i],
  wing: ["Army","Army","Air","Army","Navy","Army","Army","Air","Army","Navy"][i],
  present: [31,36,22,33,28,38,29,24,35,29][i],
  total: 40,
  pct: [78,91,55,82,69,95,73,60,88,72][i],
}));

export default function Reports() {
  const [monthly,  setMonthly]  = useState([]);
  const [cadets,   setCadets]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [alert,    setAlert]    = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [wingF,    setWingF]    = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const [rpt, cadRes] = await Promise.allSettled([
          api.attendance.report({ group: "month" }),
          api.cadets.list(),
        ]);
        setMonthly(rpt.status === "fulfilled" ? (rpt.value?.monthly || rpt.value || MOCK_MONTHLY) : MOCK_MONTHLY);
        setCadets(cadRes.status === "fulfilled" ? (cadRes.value?.cadets || cadRes.value || MOCK_CADETS) : MOCK_CADETS);
      } catch {
        setMonthly(MOCK_MONTHLY); setCadets(MOCK_CADETS);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = cadets.filter(c => wingF === "All" || c.wing === wingF);

  const handleExport = () => {
    const rows = filtered.map(c => ({
      "Roll No":   c.roll_no,
      "Name":      c.name,
      "Rank":      c.rank,
      "Wing":      c.wing,
      "Present":   c.present || Math.round((c.pct / 100) * (c.total || 40)),
      "Total":     c.total || 40,
      "Att %":     c.pct,
      "Status":    c.pct >= 75 ? "Eligible" : "Below Threshold",
    }));
    downloadCSV(rows, `ncc_attendance_report_${new Date().toISOString().slice(0,10)}.csv`);
    setAlert({ type: "success", msg: "Report exported as CSV." });
  };

  if (loading) return <FullPageLoader message="Generating reports…" />;

  const avgPct = filtered.length ? Math.round(filtered.reduce((s, c) => s + (c.pct || 0), 0) / filtered.length) : 0;
  const above75 = filtered.filter(c => c.pct >= 75).length;
  const below75 = filtered.length - above75;

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title="Attendance Reports"
        subtitle="Unit-wide analysis and individual cadet records"
        actions={<button className="btn btn-olive" onClick={handleExport}>⬇ Export CSV</button>}
      />

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Summary stats */}
      <div className="stat-grid" style={{ marginTop: alert ? 16 : 0 }}>
        <StatCard label="Unit Average"     value={`${avgPct}%`}     accent={avgPct >= 75 ? "var(--success)" : "var(--warning)"} icon="📊" />
        <StatCard label="Above 75%"        value={above75}          accent="var(--success)" sub="eligible cadets" icon="✅" />
        <StatCard label="Below 75%"        value={below75}          accent="var(--danger)"  sub="need improvement" icon="⚠" />
        <StatCard label="Total Cadets"     value={filtered.length}  accent="var(--navy-700)" icon="👥" />
      </div>

      {/* Monthly trend chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Monthly Attendance Trend</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--slate-500)" }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: "var(--navy-900)", border: "none", borderRadius: 8, color: "white", fontSize: 12 }}
                formatter={(v) => [`${v}%`, "Avg Attendance"]}
              />
              <Line type="monotone" dataKey="avg_pct" stroke="var(--gold-500)" strokeWidth={2.5} dot={{ fill: "var(--gold-500)", r: 4 }} name="Avg %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Parades per Month</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-200)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
              <Tooltip
                contentStyle={{ background: "var(--navy-900)", border: "none", borderRadius: 8, color: "white", fontSize: 12 }}
              />
              <Bar dataKey="parades" fill="var(--navy-700)" radius={[4,4,0,0]} name="Parades" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual cadet report */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 10 }}>
          <span className="card-title">Individual Cadet Report</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className="form-select" value={wingF} onChange={e => setWingF(e.target.value)} style={{ width: 130 }}>
              <option value="All">All Wings</option>
              {["Army","Air","Navy"].map(w => <option key={w}>{w}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={handleExport}>⬇ Export</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cadet</th>
                <th>Roll No</th>
                <th>Wing</th>
                <th>Rank</th>
                <th>Present / Total</th>
                <th>Attendance %</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><EmptyState icon="📊" title="No data" /></td></tr>
                : filtered.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.roll_no}</td>
                    <td><Badge variant={c.wing==="Army"?"olive":c.wing==="Air"?"info":"navy"}>{c.wing}</Badge></td>
                    <td>{c.rank}</td>
                    <td style={{ color: "var(--slate-600)" }}>
                      {c.present ?? Math.round((c.pct/100)*(c.total||40))} / {c.total || 40}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: c.pct>=75?"var(--success)":c.pct>=60?"var(--warning)":"var(--danger)" }}>
                        {c.pct}%
                      </span>
                    </td>
                    <td style={{ width: 120 }}><ProgressBar value={c.pct} /></td>
                    <td>
                      <Badge variant={c.pct>=75?"success":c.pct>=60?"warning":"danger"}>
                        {c.pct>=75?"Eligible":"Below 75%"}
                      </Badge>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}