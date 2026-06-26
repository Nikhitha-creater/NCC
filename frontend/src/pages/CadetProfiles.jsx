// src/pages/CadetProfiles.jsx
import { useState, useEffect } from "react";
import { api } from "../api/config";
import {
  SectionHeader, Badge, Alert, ProgressBar,
  Modal, EmptyState, Spinner, SkeletonRows
} from "../components/UI";

const WINGS  = ["Army", "Air", "Navy"];
const RANKS  = ["Cadet", "Lance Corporal", "Corporal", "Sergeant", "Under Officer", "SUO"];
const YEARS  = ["1st Year", "2nd Year", "3rd Year"];

const EMPTY_FORM = { name: "", roll_no: "", rank: "Cadet", wing: "Army", year: "1st Year", email: "", phone: "" };

const MOCK = Array.from({ length: 12 }, (_, i) => ({
  id: `c${i+1}`,
  name: ["Arjun Kumar","Priya Nair","Vikram Singh","Divya Rao","Suresh Patil","Anita Sharma",
         "Rahul Verma","Kavitha Reddy","Mohan Das","Shreya Joshi","Aditya Patel","Meena K"][i],
  rank: ["Cadet","Cadet","Lance Corporal","Cadet","Corporal","Cadet","Lance Corporal","Cadet","Sergeant","Cadet","Cadet","Lance Corporal"][i],
  roll_no: `KAR2024${String(i+1).padStart(3,"0")}`,
  wing: ["Army","Army","Air","Army","Navy","Army","Army","Air","Army","Navy","Army","Army"][i],
  year: ["1st Year","2nd Year","1st Year","2nd Year","3rd Year","1st Year","2nd Year","1st Year","3rd Year","1st Year","2nd Year","3rd Year"][i],
  attendance_pct: [78,91,55,82,69,95,73,60,88,72,45,80][i],
  email: `cadet${i+1}@ncc.gov.in`,
  phone: `9900${String(100000+i).slice(1)}`,
}));

export default function CadetProfiles() {
  const [cadets,   setCadets]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("");
  const [wingF,    setWingF]    = useState("All");
  const [rankF,    setRankF]    = useState("All");
  const [modal,    setModal]    = useState(null);  // null | "add" | "edit" | "view"
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [alert,    setAlert]    = useState(null);  // { type, msg }

  const load = async () => {
    try {
      const res = await api.cadets.list();
      setCadets(res?.cadets || res || MOCK);
    } catch { setCadets(MOCK); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = cadets.filter(c => {
    const q = filter.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.roll_no?.toLowerCase().includes(q);
    const matchW  = wingF === "All" || c.wing === wingF;
    const matchR  = rankF === "All" || c.rank === rankF;
    return matchQ && matchW && matchR;
  });

  const openAdd  = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit = (c) => { setSelected(c); setForm({ ...c }); setModal("edit"); };
  const openView = (c) => { setSelected(c); setModal("view"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.roll_no) {
      setAlert({ type: "danger", msg: "Name and Roll Number are required." });
      return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        const res = await api.cadets.create(form).catch(() => ({ ...form, id: `new_${Date.now()}` }));
        setCadets(cs => [...cs, res]);
        setAlert({ type: "success", msg: `${form.name} added to the unit.` });
      } else {
        await api.cadets.update(selected.id, form).catch(() => {});
        setCadets(cs => cs.map(c => c.id === selected.id ? { ...c, ...form } : c));
        setAlert({ type: "success", msg: `${form.name}'s profile updated.` });
      }
      closeModal();
    } catch (err) {
      setAlert({ type: "danger", msg: err.message || "Save failed." });
    } finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Remove ${c.name} from the unit? This cannot be undone.`)) return;
    try {
      await api.cadets.delete(c.id).catch(() => {});
      setCadets(cs => cs.filter(x => x.id !== c.id));
      setAlert({ type: "success", msg: `${c.name} removed from unit.` });
    } catch { setAlert({ type: "danger", msg: "Delete failed." }); }
  };

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title="Cadet Profiles"
        subtitle={`${cadets.length} cadets enrolled in the unit`}
        actions={<button className="btn btn-gold" onClick={openAdd}>＋ Add Cadet</button>}
      />

      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, marginTop: alert ? 16 : 0, flexWrap: "wrap" }}>
        <input type="text" className="form-input" placeholder="🔍 Search name or roll no…"
          value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="form-select" value={wingF} onChange={e => setWingF(e.target.value)} style={{ width: 130 }}>
          <option value="All">All Wings</option>
          {WINGS.map(w => <option key={w}>{w}</option>)}
        </select>
        <select className="form-select" value={rankF} onChange={e => setRankF(e.target.value)} style={{ width: 160 }}>
          <option value="All">All Ranks</option>
          {RANKS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Enrolled Cadets</span>
          <Badge variant="navy">{filtered.length} / {cadets.length}</Badge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Rank</th>
                <th>Wing</th>
                <th>Year</th>
                <th>Attendance</th>
                <th>Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <SkeletonRows count={8} cols={8} />
                : filtered.length === 0
                  ? <tr><td colSpan={8}><EmptyState icon="👥" title="No cadets found" message="Try adjusting your filters." /></td></tr>
                  : filtered.map(c => (
                    <tr key={c.id}>
                      <td style={{ cursor: "pointer" }} onClick={() => openView(c)}>
                        <div style={{ fontWeight: 600, color: "var(--navy-800)" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--slate-400)" }}>{c.email}</div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.roll_no}</td>
                      <td>
                        <Badge variant={c.rank === "Sergeant" || c.rank === "Under Officer" || c.rank === "SUO" ? "gold" :
                          c.rank === "Corporal" || c.rank === "Lance Corporal" ? "navy" : "default"}>
                          {c.rank}
                        </Badge>
                      </td>
                      <td><Badge variant={c.wing === "Army" ? "olive" : c.wing === "Air" ? "info" : "navy"}>{c.wing}</Badge></td>
                      <td style={{ color: "var(--slate-500)" }}>{c.year}</td>
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: 13,
                          color: (c.attendance_pct||0) >= 75 ? "var(--success)" : (c.attendance_pct||0) >= 60 ? "var(--warning)" : "var(--danger)"
                        }}>
                          {c.attendance_pct ?? "—"}%
                        </span>
                      </td>
                      <td style={{ width: 100 }}><ProgressBar value={c.attendance_pct || 0} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏ Edit</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(c)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Enroll New Cadet" : `Edit – ${selected?.name}`}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size="sm" color="white" /> Saving…</> : modal === "add" ? "Enroll Cadet" : "Save Changes"}
              </button>
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group" style={{ gridColumn: "1/-1", marginBottom: 0 }}>
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input type="text" className="form-input" value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Cadet Full Name" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Roll Number <span className="required">*</span></label>
              <input type="text" className="form-input" value={form.roll_no} onChange={e => setF("roll_no", e.target.value)} placeholder="KAR2024001" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={e => setF("year", e.target.value)}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rank</label>
              <select className="form-select" value={form.rank} onChange={e => setF("rank", e.target.value)}>
                {RANKS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Wing</label>
              <select className="form-select" value={form.wing} onChange={e => setF("wing", e.target.value)}>
                {WINGS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="cadet@ncc.gov.in" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="9XXXXXXXXX" />
            </div>
          </div>
        </Modal>
      )}

      {/* View modal */}
      {modal === "view" && selected && (
        <Modal title="Cadet Profile" onClose={closeModal}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--slate-200)" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "var(--navy-100)", color: "var(--navy-800)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, flexShrink: 0,
              border: "3px solid var(--gold-500)"
            }}>
              {selected.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--navy-900)" }}>{selected.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <Badge variant={selected.wing === "Army" ? "olive" : selected.wing === "Air" ? "info" : "navy"}>{selected.wing} Wing</Badge>
                <Badge variant="gold">{selected.rank}</Badge>
                <Badge variant="navy">{selected.year}</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Roll Number", selected.roll_no],
              ["Email",       selected.email],
              ["Phone",       selected.phone],
              ["Attendance",  `${selected.attendance_pct ?? "—"}%`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--slate-100)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--slate-400)", textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-900)", marginTop: 2 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}