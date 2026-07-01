// src/pages/CadetProfiles.jsx
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

// ── MOCK PROFILE ──────────────────────────────────────────────────────────────
const MOCK_PROFILE = {
  regNo: "NCC/TN/VIT/2023/0047",
  name: "Cadet R. Arjun Kumar",
  dob: "2004-03-14",
  battalion: "7 TN BN NCC",
  unit: "VIT Vellore NCC Unit",
  wing: "Army Wing – Senior Division (SD)",
  rank: "Lance Corporal",
  rankSince: "2025-01-15",
  enrolledDate: "2023-08-10",
  bloodGroup: "O+",
  idNo: "ANO/VIT/2023-47",
  anoName: "Lt Col S. Krishnamurthy (Retd)",
  contactEmail: "arjun.kumar@vit.ac.in",
  contactPhone: "+91-98765-43210",
  certificates: [
    { level: "A Certificate", status: "Cleared", year: 2024, grade: "Good" },
    { level: "B Certificate", status: "Eligible", year: 2025, grade: "—" },
  ],
  camps: [
    {
      id: 1,
      name: "Annual Training Camp (ATC)",
      year: 2024,
      location: "NCC Training Centre, Pune",
      duration: "10 days",
      grade: "Good",
      achievements: "Best Cadet (Drill) – Runner Up",
    },
    {
      id: 2,
      name: "Combined Annual Training Camp (CATC)",
      year: 2024,
      location: "Air Force Station, Tambaram",
      duration: "7 days",
      grade: "Satisfactory",
      achievements: "",
    },
    {
      id: 3,
      name: "Rock Climbing & Adventure Camp",
      year: 2023,
      location: "Yercaud Hills, Salem",
      duration: "5 days",
      grade: "Good",
      achievements: "Completed Grade II Rock Climb",
    },
  ],
  serviceRemarks: [
    { date: "2025-01-15", remark: "Promoted to Lance Corporal for exemplary conduct and drill performance." },
    { date: "2024-11-20", remark: "Represented unit at State Level NCC Day parade." },
    { date: "2024-08-15", remark: "Participated in Independence Day parade at district level." },
  ],
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function certVariant(status) {
  return status === "Cleared" ? "success" : status === "Eligible" ? "warning" : "navy";
}

function gradeVariant(g) {
  return g === "Good" || g === "Very Good" ? "success" : g === "Satisfactory" ? "warning" : "navy";
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--slate-100)", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "var(--slate-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 160, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: "var(--navy-900)", fontWeight: 500, flex: 1 }}>
        {value || "—"}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="card" style={{ padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CadetProfiles() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.cadets?.profile?.()
      .then((res) => {
        setProfile(res || MOCK_PROFILE);
      })
      .catch((err) => {
        console.warn("[CadetProfiles] API unavailable, using mock data:", err);
        setProfile(MOCK_PROFILE);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader message="Loading service record…" />;
  if (!profile) return <EmptyState icon="👤" title="No record found" message="Your service profile is not yet set up. Contact your ANO." />;

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      <SectionHeader
        title="Service Record"
        subtitle="Your official NCC service profile and training history"
      />

      {error && <Alert type="warning" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* ── Profile Header ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)",
        borderRadius: 14,
        padding: "24px 28px",
        display: "flex",
        gap: 20,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "3px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, color: "#fff",
          fontFamily: "var(--font-display)", flexShrink: 0,
        }}>
          {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Service Record
          </div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>
            {profile.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Badge variant="gold">{profile.rank}</Badge>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{profile.unit}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reg. No.</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "monospace", marginTop: 2 }}>{profile.regNo}</div>
        </div>
      </div>

      {/* ── Two-column grid for desktop ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* Personal Details */}
        <SectionCard title="Personal Details" icon="👤">
          <InfoRow label="Full Name"    value={profile.name} />
          <InfoRow label="Date of Birth" value={formatDate(profile.dob)} />
          <InfoRow label="Blood Group"  value={profile.bloodGroup} />
          <InfoRow label="Email"        value={profile.contactEmail} />
          <InfoRow label="Phone"        value={profile.contactPhone} />
        </SectionCard>

        {/* Service Details */}
        <SectionCard title="Service Details" icon="🎖️">
          <InfoRow label="Battalion"     value={profile.battalion} />
          <InfoRow label="Unit"          value={profile.unit} />
          <InfoRow label="Wing"          value={profile.wing} />
          <InfoRow label="Current Rank"  value={profile.rank} />
          <InfoRow label="Rank Since"    value={formatDate(profile.rankSince)} />
          <InfoRow label="Enrolled On"   value={formatDate(profile.enrolledDate)} />
          <InfoRow label="ANO"           value={profile.anoName} />
        </SectionCard>
      </div>

      {/* ── Certificate Status ── */}
      <SectionCard title="Certificate Status" icon="📜">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {profile.certificates.map((cert, i) => (
            <div key={i} style={{
              flex: "1 1 200px",
              border: "1px solid var(--slate-200)",
              borderRadius: 10,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-800)", marginBottom: 8 }}>{cert.level}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <Badge variant={certVariant(cert.status)}>{cert.status}</Badge>
                {cert.grade !== "—" && <Badge variant={gradeVariant(cert.grade)}>{cert.grade}</Badge>}
              </div>
              <div style={{ fontSize: 12, color: "var(--slate-400)" }}>Year: {cert.year}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Camp Attendance Log ── */}
      <SectionCard title="Camp Attendance Log" icon="🏕️">
        {profile.camps.length === 0 ? (
          <EmptyState icon="🏕️" title="No camps recorded" message="Camp attendance will appear here once data is available." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profile.camps.map(camp => (
              <div key={camp.id} style={{
                border: "1px solid var(--slate-200)",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}>
                {/* Year pill */}
                <div style={{
                  background: "var(--navy-50)",
                  border: "1px solid var(--navy-200)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  textAlign: "center",
                  minWidth: 52,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy-800)", fontFamily: "var(--font-display)" }}>{camp.year}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy-900)" }}>{camp.name}</span>
                    <Badge variant={gradeVariant(camp.grade)}>{camp.grade}</Badge>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--slate-500)", marginBottom: camp.achievements ? 8 : 0 }}>
                    📍 {camp.location} · ⏱ {camp.duration}
                  </div>
                  {camp.achievements ? (
                    <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                      🏅 {camp.achievements}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Service Remarks / Commendations ── */}
      <SectionCard title="Service Remarks" icon="📝">
        {profile.serviceRemarks.length === 0 ? (
          <EmptyState icon="📝" title="No remarks" message="Service remarks from your officers will appear here." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {profile.serviceRemarks.map((r, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 16,
                padding: "12px 0",
                borderBottom: i < profile.serviceRemarks.length - 1 ? "1px solid var(--slate-100)" : "none",
              }}>
                <span style={{
                  fontSize: 12,
                  color: "var(--slate-400)",
                  whiteSpace: "nowrap",
                  paddingTop: 2,
                  minWidth: 110,
                }}>
                  {formatDate(r.date)}
                </span>
                <span style={{ fontSize: 13, color: "var(--slate-700)", lineHeight: 1.6 }}>{r.remark}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
