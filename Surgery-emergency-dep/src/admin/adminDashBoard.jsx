import { useState, useEffect, useCallback } from "react";
import {
  HeartPulse, Users, Stethoscope, Activity, ShieldCheck,
  AlertCircle, Clock, TrendingUp, Bell, LogOut, Settings,
  ChevronRight, MoreHorizontal, Plus, Search, RefreshCw,
  Loader2, UserPlus, Trash2, X, CheckCircle, Building2,
  Calendar, FileText, Syringe, Monitor, Menu
} from "lucide-react";

// Fixed imports to match the actual exported names from api.js
import {
  adminAPI,
  emergencyAPI,
  surgeryAPI,
} from "../auth/api";

// ─── colour tokens (mirrors sign-in) ────────────────────────────────────────
const C = {
  blue:    "#1d4ed8",   // blue-700
  blueDk:  "#1e40af",   // blue-800
  blueLt:  "#eff6ff",   // blue-50
  green:   "#16a34a",
  greenLt: "#f0fdf4",
  red:     "#dc2626",
  redLt:   "#fef2f2",
  amber:   "#d97706",
  amberLt: "#fffbeb",
  violet:  "#7c3aed",
  violetLt:"#f5f3ff",
  slate9:  "#0f172a",
  slate8:  "#1e293b",
  slate6:  "#475569",
  slate4:  "#94a3b8",
  slate2:  "#e2e8f0",
  slate1:  "#f1f5f9",
  slate05: "#f8fafc",
};

// ─── tiny helpers ────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

const PRIORITY_COLOR = { CRITICAL: C.red, HIGH: C.amber, MEDIUM: C.blue, LOW: C.green };
const STATUS_COLOR   = { WAITING: C.amber, IN_TREATMENT: C.blue, STABLE: C.green, ADMITTED: C.violet, DISCHARGED: C.slate4 };
const SURGERY_COLOR  = { IN_PROGRESS: C.blue, PENDING: C.violet, COMPLETED: C.green, CANCELLED: C.slate4 };

// ─── sub-components ──────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}30`,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      letterSpacing: "0.02em", whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16,
      padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + "18", border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.slate9, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: C.slate4, marginTop: 3 }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, color: C.green, background: C.greenLt, padding: "2px 8px", borderRadius: 20 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action, onAction, loading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.slate8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h3>
      {action && (
        <button onClick={onAction} style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
          borderRadius: 8, transition: "background 0.15s"
        }} onMouseOver={e => e.currentTarget.style.background = C.blueLt}
           onMouseOut={e => e.currentTarget.style.background = "none"}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : null}
          {action} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", position: "relative"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.slate9 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, id, type = "text", value, onChange, placeholder, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.slate6, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children || (
        <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          style={{
            width: "100%", padding: "9px 12px", border: `1px solid ${C.slate2}`, borderRadius: 10,
            fontSize: 13, color: C.slate9, background: "#fff", outline: "none", transition: "border 0.15s", boxSizing: "border-box"
          }}
          onFocus={e => e.target.style.borderColor = C.blue}
          onBlur={e => e.target.style.borderColor = C.slate2}
        />
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab]     = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveData, setLiveData]       = useState(null);
  const [patients, setPatients]       = useState([]);
  const [doctors, setDoctors]         = useState([]);
  const [nurses, setNurses]           = useState([]);
  const [loading, setLoading]         = useState({ live: true, patients: false, doctors: false, nurses: false });
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState({});
  const [formError, setFormError]     = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]             = useState(null);
  const [staffView, setStaffView]     = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── live overview ──────────────────────────────────────────────────────────
  const loadLive = useCallback(async () => {
    try {
      const [emergencyRes, surgeryRes, doctorsRes] = await Promise.all([
        emergencyAPI.getAllCases(),
        surgeryAPI.getTodaySurgeries(),
        adminAPI.getAllDoctors()
      ]);
      console.log("Live data loaded:", { emergency: emergencyRes.data, surgeries: surgeryRes.data, availableDoctors: doctorsRes.data });
      setLiveData({
        emergency: emergencyRes.data,
        surgeries: surgeryRes.data,
        availableDoctors: doctorsRes.data
      });
    } catch {
      console.error("Failed to load live data");
    } finally {
      setLoading(p => ({ ...p, live: false }));
    }
  }, []);

  useEffect(() => {
    loadLive();
    const id = setInterval(loadLive, 30_000);
    return () => clearInterval(id);
  }, [loadLive]);

  // ── patients list ──────────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    setLoading(p => ({ ...p, patients: true }));
    try {
      const response = await adminAPI.getAllPatients();
      setPatients(response.data);
    } catch { 
      showToast("Failed to load patients", "error"); 
    } finally { 
      setLoading(p => ({ ...p, patients: false })); 
    }
  }, []);

  // ── doctors list ──────────────────────────────────────────────────────────
const loadDoctors = useCallback(async () => {
  setLoading(p => ({ ...p, doctors: true }));

  try {
    const response = await adminAPI.getAllDoctors();

    const normalized = (response?.data || []).map(d => ({
      ...d,
      createdAt: d.createdAt || d.create_at,
    }));

    setDoctors(normalized);

  } catch (err) { 
    console.error("❌ Doctors API error:", err);
    showToast("Failed to load doctors", "error"); 
    setDoctors([]);
  } finally { 
    setLoading(p => ({ ...p, doctors: false })); 
  }
}, []);

  // ── nurses list ──────────────────────────────────────────────────────────
const loadNurses = useCallback(async () => {
  setLoading(p => ({ ...p, nurses: true }));

  try {
    console.log("📡 Calling getAllNurses API...");

    const response = await adminAPI.getAllNurses();

    console.log("✅ Nurses response:", response);

    const normalized = (response?.data || []).map(n => ({
      ...n,
      createdAt: n.createdAt || n.create_at, // fix backend mismatch
    }));

    setNurses(normalized);

  } catch (err) {
    console.error("❌ Nurses API error:", err);
    showToast("Failed to load nurses", "error");
    setNurses([]); // prevent UI freeze
  } finally {
    setLoading(p => ({ ...p, nurses: false }));
  }
}, []);

  useEffect(() => {
    if (activeTab === "patients") loadPatients();
    if (activeTab === "staff") {
      loadDoctors();
      loadNurses();
    }
  }, [activeTab, loadPatients, loadDoctors, loadNurses]);

  // ── derived stats ──────────────────────────────────────────────────────────
  const stats = (() => {
    if (!liveData) return null;
    const { emergency = [], surgeries = [], availableDoctors = [] } = liveData;
    return {
      erActive:    emergency.filter(e => ["WAITING", "IN_TREATMENT"].includes(e.status)).length,
      erCritical:  emergency.filter(e => e.priority === "CRITICAL").length,
      surgActive:  surgeries.filter(s => s.surgeryStatus === "IN_PROGRESS").length,
      surgPending: surgeries.filter(s => s.surgeryStatus === "PENDING").length,
      docsAvail:   availableDoctors.filter(d => d.availability?.length > 0).length,
      totalDocs:   availableDoctors.length,
      emergency, surgeries,
    };
  })();

  // ── get display staff based on view filter ────────────────────────────────
  const getDisplayStaff = () => {
    switch(staffView) {
      case "doctors":
        return doctors.map(d => ({ ...d, staffType: "DOCTOR" }));
      case "nurses":
        return nurses.map(n => ({ ...n, staffType: "NURSE" }));
      default:
        const allStaff = [
          ...doctors.map(d => ({ ...d, staffType: "DOCTOR" })),
          ...nurses.map(n => ({ ...n, staffType: "NURSE" }))
        ];
        return allStaff.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const displayStaff = getDisplayStaff();
  const staffCount = {
    total: doctors.length + nurses.length,
    doctors: doctors.length,
    nurses: nurses.length
  };

  // ── form helpers ──────────────────────────────────────────────────────────
  const openModal = (name) => { setModal(name); setForm({}); setFormError(""); };
  const closeModal = () => { setModal(null); setForm({}); setFormError(""); setDeleteTarget(null); };
  const fv = (k) => form[k] || "";
  const ff = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submitDoctor = async () => {
    setFormLoading(true); setFormError("");
    try {
      await adminAPI.createDoctor({ ...form, age: Number(form.age) });
      showToast("Doctor created successfully");
      closeModal(); loadDoctors();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || "Failed to create doctor");
    } finally { setFormLoading(false); }
  };

  const submitNurse = async () => {
    setFormLoading(true); setFormError("");
    try {
      await adminAPI.createNurse({ ...form, age: Number(form.age) });
      showToast("Nurse created successfully");
      closeModal(); loadNurses();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || "Failed to create nurse");
    } finally { setFormLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await adminAPI.deleteUser(deleteTarget.id);
      showToast("User deleted");
      setDeleteTarget(null); closeModal();
      if (activeTab === "patients") loadPatients();
      if (activeTab === "staff") {
        loadDoctors();
        loadNurses();
      }
    } catch { 
      showToast("Failed to delete user", "error"); 
    } finally { 
      setFormLoading(false); 
    }
  };

  // ─── sidebar nav ──────────────────────────────────────────────────────────
  const NAV = [
    { id: "overview",  label: "Overview",   icon: Monitor },
    { id: "emergency", label: "Emergency",  icon: Activity },
    { id: "surgery",   label: "Surgeries",  icon: Syringe },
    { id: "patients",  label: "Patients",   icon: Users },
    { id: "staff",     label: "Staff",      icon: Stethoscope },
  ];

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.slate05, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: sidebarOpen ? 240 : 0, minHeight: "100vh", flexShrink: 0,
        background: "linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%)",
        transition: "width 0.25s ease", overflow: "hidden", position: "sticky", top: 0, height: "100vh"
      }}>
        <div style={{ width: 240, padding: "24px 16px", display: "flex", flexDirection: "column", height: "100%" }}>

          {/* brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeartPulse size={18} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>MediCore</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>

          {/* nav */}
          <nav style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 10 }}>Navigation</div>
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 10px", borderRadius: 10, marginBottom: 2,
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer",
                  transition: "all 0.15s", textAlign: "left"
                }}>
                  <Icon size={15} />
                  {label}
                  {id === "emergency" && stats?.erCritical > 0 && (
                    <span style={{ marginLeft: "auto", background: C.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>{stats.erCritical}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* logout */}
          <button style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10,
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)",
            fontSize: 13, cursor: "pointer", transition: "all 0.15s"
          }} onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* top bar */}
        <header style={{
          background: "#fff", borderBottom: `1px solid ${C.slate2}`, padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10
        }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4, padding: 4 }}>
            <Menu size={18} />
          </button>
          <div style={{ flex: 1, position: "relative", maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.slate4 }} />
            <input placeholder="Search patients, staff…" style={{
              width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, color: C.slate8,
              background: C.slate05, outline: "none", boxSizing: "border-box"
            }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={loadLive} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4 }}>
              <RefreshCw size={15} style={{ animation: loading.live ? "spin 1s linear infinite" : "none" }} />
            </button>
            <div style={{ position: "relative" }}>
              <Bell size={17} style={{ color: C.slate4 }} />
              {stats?.erCritical > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: C.red, border: "2px solid #fff" }} />}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>A</div>
          </div>
        </header>

        {/* content */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div>
              {/* welcome banner */}
              <div style={{
                background: "linear-gradient(120deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)",
                borderRadius: 20, padding: "24px 28px", marginBottom: 24, position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ position: "absolute", right: 30, top: 10, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ position: "relative" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, marginBottom: 6 }}>Hospital Admin Dashboard</h1>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>Monitor operations, manage staff, and track live system health.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 0 3px rgba(74,222,128,0.25)" }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Live — auto-refreshes every 30s</span>
                  </div>
                </div>
              </div>

              {/* stat cards */}
              {loading.live && !stats ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ height: 88, borderRadius: 16, background: C.slate2, animation: "pulse 2s ease infinite" }} />)}
                </div>
              ) : stats ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
                  <StatCard icon={Activity}    label="ER Active Cases"    value={stats.erActive}    color={C.blue}   sub={stats.erCritical > 0 ? `${stats.erCritical} critical` : null} />
                  <StatCard icon={Syringe}     label="Surgeries Today"    value={stats.surgActive}  color={C.green}  sub={`${stats.surgPending} pending`} />
                  <StatCard icon={Stethoscope} label="Doctors Available"  value={stats.docsAvail}   color={C.violet} sub={`of ${stats.totalDocs}`} />
                  <StatCard icon={ShieldCheck} label="System Status"      value="Online"            color={C.green}  />
                </div>
              ) : null}

              {/* two-column lower */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {/* ER queue */}
                <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, padding: "18px 20px" }}>
                  <SectionHeader title="Emergency Queue" action="View all" onAction={() => setActiveTab("emergency")} />
                  {stats?.emergency?.slice(0, 5).map((e, i) => (
                    <div key={e.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.slate1}` : "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[e.priority] || C.slate4, flexShrink: 0, boxShadow: ["CRITICAL","HIGH"].includes(e.priority) ? `0 0 0 3px ${PRIORITY_COLOR[e.priority]}30` : "none" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{e.priority || "—"} priority</div>
                        <div style={{ fontSize: 11, color: C.slate4 }}>{timeAgo(e.arrivalTime)}</div>
                      </div>
                      <Badge label={e.status?.replace("_", " ") || "—"} color={STATUS_COLOR[e.status] || C.slate4} />
                    </div>
                  ))}
                  {!stats?.emergency?.length && <div style={{ fontSize: 12, color: C.slate4, textAlign: "center", paddingTop: 12 }}>No active emergencies</div>}
                </div>

                {/* surgeries */}
                <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, padding: "18px 20px" }}>
                  <SectionHeader title="Active Surgeries" action="View all" onAction={() => setActiveTab("surgery")} />
                  {stats?.surgeries?.filter(s => s.surgeryStatus !== "CANCELLED").slice(0, 5).map((s, i, arr) => (
                    <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.slate1}` : "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: SURGERY_COLOR[s.surgeryStatus] || C.slate4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{s.type || "Surgery"}</div>
                        <div style={{ fontSize: 11, color: C.slate4 }}>{timeAgo(s.startedAt || s.createdAt)}</div>
                      </div>
                      <Badge label={s.surgeryStatus?.replace("_", " ") || "—"} color={SURGERY_COLOR[s.surgeryStatus] || C.slate4} />
                    </div>
                  ))}
                  {!stats?.surgeries?.filter(s => s.surgeryStatus !== "CANCELLED").length && <div style={{ fontSize: 12, color: C.slate4, textAlign: "center", paddingTop: 12 }}>No surgeries today</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── EMERGENCY ── */}
          {activeTab === "emergency" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>Emergency Queue</h2>
                <p style={{ fontSize: 13, color: C.slate4, margin: "4px 0 0" }}>Live ER patient tracking</p>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.slate05 }}>
                      {["Priority", "Status", "Department", "Doctor", "Arrival", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.slate4, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.emergency?.map((e, i) => (
                      <tr key={e.id || i} style={{ borderTop: `1px solid ${C.slate1}` }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIORITY_COLOR[e.priority] || C.slate4 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.slate8 }}>{e.priority}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}><Badge label={e.status?.replace("_", " ") || "—"} color={STATUS_COLOR[e.status] || C.slate4} /></td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>{e.departmentId ? "Dept." : "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>{e.doctorId ? "Assigned" : <span style={{ color: C.slate4 }}>Unassigned</span>}</td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate4 }}>{timeAgo(e.arrivalTime)}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <button style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4 }}><MoreHorizontal size={14} /></button>
                        </td>
                      </tr>
                    ))}
                    {!stats?.emergency?.length && (
                      <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", fontSize: 13, color: C.slate4 }}>No emergency cases</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SURGERY ── */}
          {activeTab === "surgery" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>Surgeries</h2>
                <p style={{ fontSize: 13, color: C.slate4, margin: "4px 0 0" }}>All scheduled and in-progress surgeries</p>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.slate05 }}>
                      {["Type", "Status", "Priority", "Surgeon", "Scheduled", "Duration", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.slate4, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.surgeries?.map((s, i) => (
                      <tr key={s.id || i} style={{ borderTop: `1px solid ${C.slate1}` }}>
                        <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: C.slate8 }}>{s.type}</td>
                        <td style={{ padding: "10px 16px" }}><Badge label={s.surgeryStatus?.replace("_", " ") || "—"} color={SURGERY_COLOR[s.surgeryStatus] || C.slate4} /></td>
                        <td style={{ padding: "10px 16px" }}><Badge label={s.priority || "—"} color={PRIORITY_COLOR[s.priority] || C.slate4} /></td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>{s.surgeonId ? "Surgeon" : "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate4 }}>{s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate4 }}>{s.estimatedDuration ? `${s.estimatedDuration}m` : "—"}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <button style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4 }}><MoreHorizontal size={14} /></button>
                        </td>
                      </tr>
                    ))}
                    {!stats?.surgeries?.length && (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", fontSize: 13, color: C.slate4 }}>No surgeries today</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PATIENTS ── */}
          {activeTab === "patients" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>Patients</h2>
                  <p style={{ fontSize: 13, color: C.slate4, margin: "4px 0 0" }}>{patients.length} registered patients</p>
                </div>
              </div>
              <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, overflow: "hidden" }}>
                {loading.patients ? (
                  <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={20} style={{ color: C.blue, animation: "spin 1s linear infinite" }} /></div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.slate05 }}>
                        {["Patient ID", "Blood Type", "Allergies", "Profile Image", "Joined", "Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.slate4, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                       </tr>
                    </thead>
                    <tbody>
                      {patients.map((p, i) => (
                        <tr key={p.id || i} style={{ borderTop: `1px solid ${C.slate1}` }}>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6, fontFamily: "monospace" }}>{p.id?.slice(0, 8)}…</td>
                          <td style={{ padding: "10px 16px" }}>
                            {p.bloodtype ? <Badge label={p.bloodtype} color={C.red} /> : <span style={{ fontSize: 12, color: C.slate4 }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>{p.allergies || <span style={{ color: C.slate4 }}>None</span>}</td>
                          <td style={{ padding: "10px 16px" }}>
                            {p.img ? <img src={p.img} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ fontSize: 11, color: C.slate4 }}>No photo</span>}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate4 }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <button onClick={() => { setDeleteTarget(p); openModal("deleteUser"); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4, padding: 4 }}
                              onMouseOver={e => e.currentTarget.style.color = C.red}
                              onMouseOut={e => e.currentTarget.style.color = C.slate4}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!patients.length && <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", fontSize: 13, color: C.slate4 }}>No patients found</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {activeTab === "staff" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: C.slate9, margin: 0 }}>Staff Management</h2>
                  <p style={{ fontSize: 13, color: C.slate4, margin: "4px 0 0" }}>
                    {staffCount.total} total staff ({staffCount.doctors} doctors, {staffCount.nurses} nurses)
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {/* View Toggle Buttons */}
                  <div style={{ 
                    display: "flex", 
                    background: C.slate1, 
                    borderRadius: 10, 
                    padding: 2,
                    marginRight: 8
                  }}>
                    <button 
                      onClick={() => setStaffView("all")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: staffView === "all" ? "#fff" : "transparent",
                        border: staffView === "all" ? `1px solid ${C.slate2}` : "none",
                        color: staffView === "all" ? C.blue : C.slate6,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setStaffView("doctors")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: staffView === "doctors" ? "#fff" : "transparent",
                        border: staffView === "doctors" ? `1px solid ${C.slate2}` : "none",
                        color: staffView === "doctors" ? C.blue : C.slate6,
                        cursor: "pointer"
                      }}
                    >
                      Doctors ({staffCount.doctors})
                    </button>
                    <button 
                      onClick={() => setStaffView("nurses")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: staffView === "nurses" ? "#fff" : "transparent",
                        border: staffView === "nurses" ? `1px solid ${C.slate2}` : "none",
                        color: staffView === "nurses" ? C.blue : C.slate6,
                        cursor: "pointer"
                      }}
                    >
                      Nurses ({staffCount.nurses})
                    </button>
                  </div>
                  
                  <button onClick={() => openModal("addNurse")} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, fontWeight: 600,
                    color: C.slate7, cursor: "pointer", transition: "all 0.15s"
                  }}>
                    <UserPlus size={14} /> Add Nurse
                  </button>
                  <button onClick={() => openModal("addDoctor")} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    background: C.blue, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    color: "#fff", cursor: "pointer", transition: "all 0.15s"
                  }}>
                    <Plus size={14} /> Add Doctor
                  </button>
                </div>
              </div>

              <div style={{ background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 16, overflow: "hidden" }}>
                {loading.doctors && loading.nurses ? (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <Loader2 size={20} style={{ color: C.blue, animation: "spin 1s linear infinite" }} />
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.slate05 }}>
                        {["Staff", "Email", "Role", "Specialization/Dept", "Phone", "Joined", "Actions"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.slate4, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayStaff.map((staff, i) => (
                        <tr key={staff.id || i} style={{ borderTop: `1px solid ${C.slate1}` }}>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {staff.img 
                                ? <img src={staff.img} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                : <div style={{ 
                                    width: 28, height: 28, borderRadius: "50%", 
                                    background: staff.staffType === "DOCTOR" ? C.blueLt : C.violetLt, 
                                    display: "flex", alignItems: "center", justifyContent: "center", 
                                    fontSize: 11, fontWeight: 700, 
                                    color: staff.staffType === "DOCTOR" ? C.blue : C.violet 
                                  }}>
                                    {staff.name?.[0] || (staff.staffType === "DOCTOR" ? "D" : "N")}
                                  </div>
                              }
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.slate8 }}>{staff.name}</div>
                                <div style={{ fontSize: 10, color: C.slate4 }}>ID: {staff.id?.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>{staff.email}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <Badge 
                              label={staff.staffType === "DOCTOR" ? "Doctor" : "Nurse"} 
                              color={staff.staffType === "DOCTOR" ? C.blue : C.violet} 
                            />
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>
                            {staff.staffType === "DOCTOR" 
                              ? (staff.doctor?.specialization || staff.specialization || "—")
                              : (staff.staffType === "DOCTOR"
                                ? (staff.doctor?.specialization || staff.specialization || "—")
                                  : (staff.nurse?.department?.name || "—"))
                            }
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate6 }}>
                            {staff.phone || staff.nurse?.phone || "—"}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: C.slate4 }}>
                            {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <button 
                              onClick={() => { setDeleteTarget(staff); openModal("deleteUser"); }} 
                              style={{ background: "none", border: "none", cursor: "pointer", color: C.slate4, padding: 4 }}
                              onMouseOver={e => e.currentTarget.style.color = C.red}
                              onMouseOut={e => e.currentTarget.style.color = C.slate4}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {displayStaff.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: 32, textAlign: "center", fontSize: 13, color: C.slate4 }}>
                            No {staffView === "all" ? "staff" : staffView} found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══ MODALS ═══════════════════════════════════════════════════════════ */}

      {/* Add Doctor */}
      {modal === "addDoctor" && (
        <Modal title="Add New Doctor" onClose={closeModal}>
          {formError && <div style={{ background: C.redLt, border: `1px solid ${C.red}20`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={13} />{formError}</div>}
          <FormField label="Full Name" id="d-name" value={fv("name")} onChange={ff("name")} placeholder="Dr. Jane Smith" required />
          <FormField label="Email" id="d-email" type="email" value={fv("email")} onChange={ff("email")} placeholder="jane@hospital.com" required />
          <FormField label="Password" id="d-pass" type="password" value={fv("password")} onChange={ff("password")} placeholder="••••••••" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Specialization" id="d-spec" value={fv("specialization")} onChange={ff("specialization")} placeholder="Cardiology" required />
            <FormField label="Department" id="d-dept" value={fv("department")} onChange={ff("department")} placeholder="Cardiology" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FormField label="Phone" id="d-phone" value={fv("phone")} onChange={ff("phone")} placeholder="0123456789" required />
            <FormField label="Age" id="d-age" type="number" value={fv("age")} onChange={ff("age")} placeholder="35" required />
            <FormField label="Gender" id="d-gender">
              <select id="d-gender" value={fv("gender")} onChange={ff("gender")} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, color: C.slate9, background: "#fff", outline: "none", boxSizing: "border-box" }}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </FormField>
          </div>
          <button onClick={submitDoctor} disabled={formLoading} style={{
            width: "100%", padding: "10px", background: C.blue, border: "none", borderRadius: 10,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: formLoading ? "not-allowed" : "pointer",
            opacity: formLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4
          }}>
            {formLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating…</> : "Create Doctor"}
          </button>
        </Modal>
      )}

      {/* Add Nurse */}
      {modal === "addNurse" && (
        <Modal title="Add New Nurse" onClose={closeModal}>
          {formError && <div style={{ background: C.redLt, border: `1px solid ${C.red}20`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={13} />{formError}</div>}
          <FormField label="Full Name" id="n-name" value={fv("name")} onChange={ff("name")} placeholder="Nurse John" required />
          <FormField label="Email" id="n-email" type="email" value={fv("email")} onChange={ff("email")} placeholder="john@hospital.com" required />
          <FormField label="Password" id="n-pass" type="password" value={fv("password")} onChange={ff("password")} placeholder="••••••••" required />
          <FormField label="Department" id="n-dept" value={fv("department")} onChange={ff("department")} placeholder="Emergency" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FormField label="Phone" id="n-phone" value={fv("phone")} onChange={ff("phone")} placeholder="0123456789" required />
            <FormField label="Age" id="n-age" type="number" value={fv("age")} onChange={ff("age")} placeholder="28" required />
            <FormField label="Gender" id="n-gender">
              <select id="n-gender" value={fv("gender")} onChange={ff("gender")} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, color: C.slate9, background: "#fff", outline: "none", boxSizing: "border-box" }}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </FormField>
          </div>
          <button onClick={submitNurse} disabled={formLoading} style={{
            width: "100%", padding: "10px", background: C.blue, border: "none", borderRadius: 10,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: formLoading ? "not-allowed" : "pointer",
            opacity: formLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4
          }}>
            {formLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating…</> : "Create Nurse"}
          </button>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal === "deleteUser" && deleteTarget && (
        <Modal title="Confirm Delete" onClose={closeModal}>
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.redLt, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={22} style={{ color: C.red }} />
            </div>
            <p style={{ fontSize: 14, color: C.slate8, margin: 0 }}>Are you sure you want to delete this user? This cannot be undone.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "9px", background: "#fff", border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.slate6, cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmDelete} disabled={formLoading} style={{ flex: 1, padding: "9px", background: C.red, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1 }}>
              {formLoading ? "Deleting…" : "Delete User"}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ TOAST ════════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 2000,
          background: toast.type === "error" ? C.red : C.slate8,
          color: "#fff", borderRadius: 12, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", animation: "floatUp 0.25s ease"
        }}>
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.slate2}; border-radius: 10px; }
      `}</style>
    </div>
  );
}