// src/pages/ParadeSchedule.jsx – admin parade management
import { useState, useEffect } from "react";
import { api } from "../api/config";
import { SectionHeader, Badge, Alert, Modal, Spinner, EmptyState, FullPageLoader, EventCard } from "../components/UI";

const TYPES = ["Regular Parade","Camp Training","National Event","Republic Day Practice","Independence Day Practice","NIC Camp","Annual Training Camp","PT Session"];

const EMPTY = { title: "", date: "", type: "Regular Parade", location: "", time: "", notes: "" };

const MOCK = [
  { id:1, title:"Weekly Parade",          date:new Date(Date.now()+2*86400000).toISOString(), type:"Regular Parade",   location:"Parade Ground A", time:"0600 hrs" },
  { id:2, title:"Republic Day Practice",  date:new Date(Date.now()+7*86400000).toISOString(), type:"National Event",   location:"Central Ground",  time:"0530 hrs" },
  { id:3, title:"Annual Training Camp",   date:new Date(Date.now()+14*86400000).toISOString(),type:"Camp Training",    location:"Camp Dharwad",    time:"All Day" },
  { id:4, title:"PT Session",             date:new Date(Date.now()+3*86400000).toISOString(), type:"PT Session",       location:"Sports Ground",   time:"0530 hrs" },
  { id:5, title:"Independence Day Prep",  date:new Date(Date.now()+21*86400000).toISOString(),type:"Independence Day Practice", location:"City Ground", time:"0600 hrs" },
];

export default function ParadeSchedule() {
  const [parades, setParades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState(null);

  useEffect(() => {
    api.parades.list()
      .then(r => setParades(r?.parades || r || MOCK))
      .catch(() => setParades(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal("form"); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p); setModal("form"); };
  const close    = () => { setModal(null); setEditing(null); };
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.date) { setAlert({ type:"danger", msg:"Title and date are required." }); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.parades.update(editing.id, form).catch(() => {});
        setParades(ps => ps.map(p => p.id === editing.id ? { ...p, ...form } : p));
        setAlert({ type:"success", msg:"Parade updated." });
      } else {
        const res = await api.parades.create(form).catch(() => ({ ...form, id: Date.now() }));
        setParades(ps => [...ps, res]);
        setAlert({ type:"success", msg:"Parade scheduled." });
      }
      close();
    } catch (e) { setAlert({ type:"danger", msg:e.message||"Save failed." }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    await api.parades.delete(p.id).catch(() => {});
    setParades(ps => ps.filter(x => x.id !== p.id));
    setAlert({ type:"success", msg:"Parade removed." });
  };

  if (loading) return <FullPageLoader message="Loading schedule…" />;

  const upcoming = parades.filter(p => new Date(p.date) >= new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past     = parades.filter(p => new Date(p.date) <  new Date()).sort((a,b)=>new Date(b.date)-new Date(a.date));

  return (
    <div className="animate-fadeIn">
      <SectionHeader
        title="Parade Schedule"
        subtitle={`${upcoming.length} upcoming · ${past.length} past events`}
        actions={<button className="btn btn-gold" onClick={openAdd}>＋ Schedule Parade</button>}
      />
      {alert && <Alert type={alert.type} onDismiss={() => setAlert(null)}>{alert.msg}</Alert>}

      {/* Upcoming */}
      <div className="card" style={{ marginBottom: 20, marginTop: alert ? 16 : 0 }}>
        <div className="card-header">
          <span className="card-title">Upcoming Events</span>
          <Badge variant="navy">{upcoming.length}</Badge>
        </div>
        <div className="card-body">
          {upcoming.length === 0
            ? <EmptyState icon="📅" title="No upcoming parades" action={<button className="btn btn-gold btn-sm" onClick={openAdd}>Schedule one →</button>} />
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map(p => (
                  <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1 }}><EventCard event={p} /></div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Past Events</span>
            <Badge variant="default">{past.length}</Badge>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Event</th><th>Date</th><th>Type</th><th>Location</th></tr></thead>
              <tbody>
                {past.map(p => (
                  <tr key={p.id} style={{ opacity: .7 }}>
                    <td>{p.title}</td>
                    <td style={{ color:"var(--slate-500)" }}>{new Date(p.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                    <td><Badge variant="navy">{p.type}</Badge></td>
                    <td style={{ color:"var(--slate-500)",fontSize:12 }}>{p.location||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === "form" && (
        <Modal
          title={editing ? `Edit – ${editing.title}` : "Schedule New Parade"}
          onClose={close}
          footer={
            <>
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size="sm" color="white" /> Saving…</> : editing ? "Save Changes" : "Schedule Parade"}
              </button>
            </>
          }
        >
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="form-group" style={{ gridColumn:"1/-1", marginBottom:0 }}>
              <label className="form-label">Title <span className="required">*</span></label>
              <input type="text" className="form-input" value={form.title} onChange={e=>setF("title",e.target.value)} placeholder="e.g. Weekly Parade" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className="form-input" value={form.date?.split("T")[0]||form.date} onChange={e=>setF("date",e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e=>setF("type",e.target.value)}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Location</label>
              <input type="text" className="form-input" value={form.location} onChange={e=>setF("location",e.target.value)} placeholder="Parade Ground A" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Time</label>
              <input type="text" className="form-input" value={form.time} onChange={e=>setF("time",e.target.value)} placeholder="0600 hrs" />
            </div>
            <div className="form-group" style={{ gridColumn:"1/-1", marginBottom:0 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="Any special instructions…" style={{ resize:"vertical" }} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}