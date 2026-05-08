import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowLeft, User, Mail, Phone, Calendar, Droplets, AlertTriangle,
  Shield, Edit3, Save, X, Camera, CheckCircle2, Loader2, BadgeCheck,
  FileText, Plus, Scissors, CalendarDays, Upload, Eye,
  ChevronRight, Activity, XCircle, Stethoscope,
} from "lucide-react";
import { patientAPI, surgeryAPI } from "../auth/api";

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────────────────────────
const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";

const APPT_STATUS = {
  SCHEDULED: { label: "Scheduled",   color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200",  dot: "bg-violet-500",  icon: CalendarDays },
  ACTIVE:    { label: "Active",      color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500",   icon: Activity, pulse: true },
  COMPLETED: { label: "Done",        color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled",   color: "text-slate-500",   bg: "bg-slate-50",    border: "border-slate-200",   dot: "bg-slate-400",   icon: XCircle },
};
const SURG_STATUS = {
  PENDING:     { label: "Scheduled",   gradient: "from-violet-500 to-indigo-500", glow: "#7c3aed" },
  IN_PROGRESS: { label: "In Progress", gradient: "from-amber-500 to-orange-500",  glow: "#d97706" },
  COMPLETED:   { label: "Completed",   gradient: "from-emerald-500 to-teal-500",  glow: "#059669" },
  CANCELLED:   { label: "Cancelled",   gradient: "from-slate-400 to-slate-500",   glow: "#94a3b8" },
};

// ─── Glass card wrapper ───────────────────────────────────────────────────────
function Glass({ children, className = "", style = {} }) {
  return (
    <div
      className={`relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[1.75rem] shadow-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.48)", ...style }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

// ─── Edit field ───────────────────────────────────────────────────────────────
function EditField({ label, name, value, onChange, type = "text", options }) {
  const base = "w-full px-3 py-2.5 rounded-xl border border-white/50 text-slate-800 font-semibold text-sm outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20 transition-all";
  const bg   = { background: "rgba(255,255,255,0.65)" };
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">{label}</label>
      {options
        ? <select name={name} value={value || ""} onChange={onChange} className={base} style={bg}>
            <option value="">Select…</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} name={name} value={value || ""} onChange={onChange} className={base} style={bg} />
      }
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, accent = "#06b6d4" }) {
  return (
    <div className="info-row-anim flex items-center gap-3 py-2.5 border-b border-white/30 last:border-0 group">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${accent}18`, boxShadow: `0 2px 8px ${accent}20` }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">{label}</p>
        <p className="text-slate-800 font-semibold text-sm truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Appointments tab ─────────────────────────────────────────────────────────
function AppointmentsTab({ appointments }) {
  if (!appointments.length)
    return (
      <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
        <CalendarDays size={36} className="text-slate-300" />
        <p className="font-semibold">No appointments yet</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      {appointments.slice(0, 7).map(a => {
        const sc   = APPT_STATUS[a.status] ?? APPT_STATUS.SCHEDULED;
        const Icon = sc.icon;
        return (
          <div key={a.id}
            className="right-item flex items-center gap-3 p-3.5 rounded-2xl border border-white/40 hover:border-white/70 hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.42)" }}>
            <div className={`w-9 h-9 rounded-xl ${sc.bg} ${sc.border} border flex items-center justify-center shrink-0`}>
              <Icon size={15} className={sc.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{a.doctor?.department?.name ?? "Appointment"}</p>
              <p className="text-[11px] text-slate-500">{fmt(a.scheduledAt)} · {fmtTime(a.scheduledAt)}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.color} ${sc.bg} ${sc.border} shrink-0`}>
              <span className={`w-1 h-1 rounded-full ${sc.dot} ${sc.pulse ? "animate-pulse" : ""}`} />
              {sc.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Surgeries tab ────────────────────────────────────────────────────────────
function SurgeriesTab({ surgeries }) {
  if (!surgeries.length)
    return (
      <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
        <Scissors size={36} className="text-slate-300" />
        <p className="font-semibold">No surgeries on record</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5">
      {surgeries.slice(0, 7).map(s => {
        const sc = SURG_STATUS[s.surgeryStatus] ?? SURG_STATUS.PENDING;
        return (
          <div key={s.id}
            className="right-item flex items-center gap-3 p-3.5 rounded-2xl border border-white/40 hover:border-white/70 hover:-translate-y-0.5 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.42)" }}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sc.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: `0 4px 10px ${sc.glow}35` }}>
              <Scissors size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{s.type} Surgery</p>
              <p className="text-[11px] text-slate-500">
                {s.surgeon?.user?.name ?? "Surgeon TBD"} · {fmt(s.scheduledAt)}
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 shrink-0">{sc.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Records tab ──────────────────────────────────────────────────────────────
function RecordsTab({ records, onAddRecord }) {
  const [showForm,    setShowForm]    = useState(false);
  const [title,       setTitle]       = useState("");
  const [files,       setFiles]       = useState([]);
  const [previews,    setPreviews]    = useState([]);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadDone,  setUploadDone]  = useState(false);
  const isMounted = useRef(true);
  const formRef   = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!formRef.current || !showForm) return;
    gsap.fromTo(formRef.current,
      { opacity: 0, y: -14, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }
    );
  }, [showForm]);

  useEffect(() => {
    return () => { previews.forEach(p => URL.revokeObjectURL(p.url)); };
  }, [previews]);

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files);
    if (!chosen.length) return;
    setUploadError("");
    setFiles(chosen);
    setPreviews(chosen.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      isImg: f.type.startsWith("image/"),
    })));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !files.length) return;
    setUploading(true);
    setUploadError("");
    setUploadDone(false);
    try {
      const fd = new FormData();
      fd.append("recordTitle", title);
      // "records" matches the multer field name in the backend router
      files.forEach(f => fd.append("records", f));
      await patientAPI.addRecord(fd);
      if (isMounted.current) {
        setUploading(false);
        setUploadDone(true);
        setTitle("");
        setFiles([]);
        setPreviews([]);
        setTimeout(async () => {
          if (isMounted.current) {
            setShowForm(false);
            setUploadDone(false);
            // re-fetch AFTER form closes so it doesn't interfere with local state
            await onAddRecord?.();
          }
        }, 1200);
      }
    } catch (err) {
      if (isMounted.current) {
        const msg =
          err?.response?.data?.message ||
          (typeof err?.response?.data === "string" ? err.response.data : null) ||
          err?.message ||
          "Upload failed. Please try again.";
        setUploadError(msg);
        setUploading(false);
      }
    }
  };

  const handleCancel = () => {
    setTitle(""); setFiles([]); setPreviews([]);
    setUploadError(""); setUploadDone(false);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setShowForm(s => !s)}
        className="self-start flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", boxShadow: "0 4px 14px rgba(6,182,212,0.35)" }}
      >
        <Plus size={14} />
        Add Record
      </button>

      {showForm && (
        <div ref={formRef} className="flex flex-col gap-3 p-4 rounded-2xl border border-cyan-200/60"
          style={{ background: "rgba(236,254,255,0.5)" }}>
          <div>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setUploadError(""); }}
              placeholder="Record title (e.g. Annual checkup, MRI scan…)"
              className="w-full px-3 py-2.5 rounded-xl border border-white/60 text-slate-800 font-semibold text-sm outline-none focus:border-cyan-400 transition-all"
              style={{ background: "rgba(255,255,255,0.75)" }}
            />
            {!title.trim() && (
              <p className="text-[11px] text-amber-500 font-medium mt-1 ml-1">
                ⚠ A title is required before saving
              </p>
            )}
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 py-7 rounded-xl border-2 border-dashed border-cyan-300/60 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition-all duration-200"
          >
            <Upload size={22} className="text-cyan-500" />
            <p className="text-sm text-slate-500 font-medium text-center">
              Click to upload files
              <span className="block text-xs text-slate-400">Images, PDFs, docs — up to 10 files</span>
            </p>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) => (
                <div key={i} title={p.name}>
                  {p.isImg
                    ? <img src={p.url} alt={p.name} className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-md" />
                    : <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-slate-100 flex flex-col items-center justify-center gap-1">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-[9px] text-slate-400 truncate w-11 text-center px-1">{p.name}</span>
                      </div>
                  }
                </div>
              ))}
            </div>
          )}

          {/* Error banner */}
          {uploadError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
              <AlertTriangle size={13} className="shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Success banner */}
          {uploadDone && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 size={13} className="shrink-0" />
              Record saved successfully!
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={uploading || !title.trim() || !files.length}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 transition-all hover:scale-105 active:scale-95"
              style={{ background: uploading || !title.trim() || !files.length ? "#9ca3af" : "linear-gradient(135deg,#10b981,#059669)" }}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {uploading ? "Uploading…" : !title.trim() ? "Enter a title first" : !files.length ? "Select a file first" : "Save Record"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 hover:bg-white/60 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!records?.length ? (
        <div className="flex flex-col items-center py-10 gap-3 text-slate-400">
          <FileText size={36} className="text-slate-300" />
          <p className="font-semibold">No medical records yet</p>
          <p className="text-sm">Upload your first record above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {records.map(r => (
            <div key={r.id}
              className="right-item group flex items-start gap-3 p-4 rounded-2xl border border-white/40 hover:border-white/70 hover:-translate-y-0.5 transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.42)" }}>
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5"
                style={{ boxShadow: "0 4px 10px rgba(6,182,212,0.3)" }}
              >
                <FileText size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{r.title}</p>
                <p className="text-[11px] text-slate-500 mb-2">{fmt(r.createdAt)} · {r.fileUrl?.length ?? 0} file(s)</p>
                {r.fileUrl?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.fileUrl.slice(0, 5).map((url, i) => {
                      const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return isImg
                        ? <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="w-10 h-10 object-cover rounded-lg border border-white shadow hover:scale-110 transition-transform" />
                          </a>
                        : <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="w-10 h-10 rounded-lg border border-white bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform shadow">
                            <Eye size={12} className="text-slate-400" />
                          </a>;
                    })}
                    {r.fileUrl.length > 5 && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                        +{r.fileUrl.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const wrapperRef    = useRef(null);
  const progressRef   = useRef(null);
  const avatarRef     = useRef(null);
  const ringRef       = useRef(null);
  const leftRef       = useRef(null);
  const rightRef      = useRef(null);
  const editRef       = useRef(null);
  const fileInputRef  = useRef(null);
  const tabContentRef = useRef(null);

  const [profile,      setProfile]    = useState(null);
  const [appointments, setAppts]      = useState([]);
  const [surgeries,    setSurgeries]  = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [editing,      setEditing]    = useState(false);
  const [saving,       setSaving]     = useState(false);
  const [saved,        setSaved]      = useState(false);
  const [activeTab,    setActiveTab]  = useState("appointments");
  const [form,         setForm]       = useState({});
  const [previewImg,   setPreviewImg] = useState(null);
  const [imgFile,      setImgFile]    = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: me } = await patientAPI.getMe();
        setProfile(me);
        setForm({
          name:      me.name                      || "",
          phone:     me.phone                     || "",
          // FIX 8: store age as string for controlled input, parse only on submit
          age:       me.age != null ? String(me.age) : "",
          bloodtype: me.patientProfile?.bloodtype || "",
          allergies: me.patientProfile?.allergies || "",
        });

        // FIX 3: userId comes from me.id, not patientProfile.userId
        const userId = me.id ?? localStorage.getItem("profile_id");
        if (userId) {
          try {
            const { data } = await patientAPI.getMyAppointments(userId);
            setAppts(data);
          } catch { /* silently fail */ }

          try {
            const { data } = await surgeryAPI.getMyStudentSurgeries();
            setSurgeries(data);
          } catch { /* silently fail */ }
        }
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── GSAP entrance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !wrapperRef.current) return;

    // FIX 5: kill existing ScrollTriggers before creating new ones
    ScrollTrigger.getAll().forEach(t => t.kill());

    const ctx = gsap.context(() => {
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom bottom",
          scrub: 0,
        },
      });

      gsap.to(".glow-tl", {
        y: 100, x: 30, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 },
      });
      gsap.to(".glow-br", {
        y: -100, x: -30, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 },
      });

      gsap.fromTo(avatarRef.current,
        { opacity: 0, y: -50, scale: 0.5, rotation: -20 },
        { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 1.1, ease: "back.out(2)", delay: 0.15 }
      );

      gsap.fromTo(ringRef.current,
        { opacity: 0, scale: 0, rotation: -120 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "back.out(1.8)", delay: 0.65 }
      );
      gsap.to(ringRef.current, {
        rotation: 360, duration: 18, ease: "none", repeat: -1, delay: 1.55,
      });

      gsap.fromTo(leftRef.current,
        { opacity: 0, x: -60, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 1, ease: "power4.out", delay: 0.25 }
      );
      gsap.fromTo(rightRef.current,
        { opacity: 0, x: 60, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 1, ease: "power4.out", delay: 0.4 }
      );

      gsap.fromTo(".info-row-anim",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.38, stagger: 0.07, ease: "power2.out", delay: 0.75, clearProps: "transform,opacity" }
      );

      gsap.fromTo(".right-item",
        { opacity: 0, x: 25 },
        {
          opacity: 1, x: 0, duration: 0.38, stagger: 0.06, ease: "power2.out", clearProps: "transform,opacity",
          scrollTrigger: { trigger: rightRef.current, start: "top 82%", once: true },
        }
      );

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading]);

  // Tab switch animation
  useEffect(() => {
    if (!tabContentRef.current) return;
    gsap.fromTo(tabContentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }, [activeTab]);

  // Edit panel slide
  useEffect(() => {
    if (!editRef.current || !editing) return;
    gsap.fromTo(editRef.current,
      { opacity: 0, y: -16, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
  }, [editing]);

  // Saved flash auto-dismiss
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange    = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // FIX 7: prevent the button click from bubbling when inside avatar div
  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setPreviewImg(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v != null) {
          // FIX 8: parse age cleanly — only append if it's a valid number
          if (k === "age") {
            const parsed = parseInt(v, 10);
            if (!isNaN(parsed)) fd.append(k, parsed);
          } else {
            fd.append(k, v);
          }
        }
      });
      if (imgFile) fd.append("profile", imgFile);
      await patientAPI.editProfile(fd);
      const { data: me } = await patientAPI.getMe();
      setProfile(me);
      setEditing(false);
      setSaved(true);
      setPreviewImg(null);
      setImgFile(null);
      gsap.fromTo(avatarRef.current,
        { scale: 1 },
        { scale: 1.14, duration: 0.18, yoyo: true, repeat: 3, ease: "power2.inOut" }
      );
    } catch { /* handle */ }
    finally { setSaving(false); }
  };

  // FIX 6: use onComplete callback to set state AFTER animation finishes — no race condition
  const handleCancel = () => {
    setPreviewImg(null);
    setImgFile(null);
    if (editRef.current) {
      gsap.to(editRef.current, {
        opacity: 0, y: -12, scale: 0.97, duration: 0.28, ease: "power2.in",
        onComplete: () => setEditing(false),
      });
    } else {
      setEditing(false);
    }
  };

  const patient   = profile?.patientProfile ?? {};
  const records   = patient?.records        ?? [];
  const avatarSrc = previewImg || patient?.img;

  const tabs = [
    { key: "appointments", label: "Appointments", icon: CalendarDays, count: appointments.length },
    { key: "surgeries",    label: "Surgeries",    icon: Scissors,     count: surgeries.length    },
    { key: "records",      label: "Records",      icon: FileText,     count: records.length      },
  ];

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed", top: 0, left: 0, height: "3px", width: "100%",
          transformOrigin: "left center", transform: "scaleX(0)",
          background: "linear-gradient(90deg,#06b6d4,#8b5cf6,#f43f5e)",
          zIndex: 9999, borderRadius: "0 2px 2px 0", pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{ backgroundImage: NOISE + ",linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)" }}
      >
        {/* Ambient glows */}
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[36rem] h-[36rem] rounded-full bg-cyan-400/20 blur-[110px]" />
        <div className="glow-br pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full bg-violet-500/20 blur-[110px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-12 py-8 pb-28">

          <Link to="/patient" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8 group">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-60">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin" />
                <p className="text-slate-400 font-semibold">Loading profile…</p>
              </div>
            </div>
          ) : (

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-6 items-start">

              {/* ════ LEFT ════ */}
              <div ref={leftRef} className="flex flex-col gap-5 lg:sticky lg:top-6">

                {/* Avatar card */}
                <Glass className="p-6 flex flex-col items-center text-center">
                  <div ref={avatarRef} className="relative mb-5">
                    <div
                      ref={ringRef}
                      className="absolute pointer-events-none"
                      style={{ inset: "-5px", borderRadius: "9999px", padding: "3px", background: "conic-gradient(from 0deg,#06b6d4,#8b5cf6,#f43f5e,#10b981,#06b6d4)" }}
                    >
                      <div className="w-full h-full rounded-full" style={{ background: "#f0f9ff" }} />
                    </div>
                    <div
                      className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl z-10"
                      style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.9),0 16px 48px rgba(6,182,212,0.28)" }}
                    >
                      {avatarSrc
                        ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
                            <User size={44} className="text-white opacity-80" />
                          </div>
                      }
                    </div>
                    {/* FIX 7: stopPropagation so the button click doesn't bubble up the avatar div */}
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white hover:scale-110 transition-transform"
                      style={{ boxShadow: "0 4px 12px rgba(6,182,212,0.4)" }}
                    >
                      <Camera size={13} className="text-cyan-600" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </div>

                  <h1 className="text-2xl font-black text-slate-900 mb-2">{profile?.name || "Your Name"}</h1>

                  <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 text-[11px] font-bold border border-cyan-400/30">
                      <BadgeCheck size={10} /> PATIENT
                    </span>
                    {profile?.gender && (
                      <span className="px-2.5 py-1 rounded-full bg-violet-500/12 text-violet-700 text-[11px] font-bold border border-violet-300/25">
                        {profile.gender}
                      </span>
                    )}
                    {profile?.age != null && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                        {profile.age} yrs
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:scale-105 hover:shadow-xl transition-all duration-200"
                        style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)", boxShadow: "0 5px 16px rgba(6,182,212,0.35)" }}
                      >
                        <Edit3 size={13} /> Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:scale-105 disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 5px 16px rgba(16,185,129,0.35)" }}
                        >
                          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-500 border border-slate-200 hover:bg-white/60 transition-all"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </>
                    )}
                    {saved && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 size={11} /> Saved!
                      </span>
                    )}
                  </div>
                </Glass>

                {/* Edit form */}
                {editing && (
                  <div ref={editRef}>
                    <Glass className="p-5">
                      <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-cyan-600 mb-4">Edit Information</p>
                      <div className="flex flex-col gap-3">
                        <EditField label="Full Name"  name="name"      value={form.name}      onChange={handleChange} />
                        <EditField label="Phone"      name="phone"     value={form.phone}     onChange={handleChange} type="tel" />
                        <EditField label="Age"        name="age"       value={form.age}       onChange={handleChange} type="number" />
                        <EditField label="Blood Type" name="bloodtype" value={form.bloodtype} onChange={handleChange} options={BLOOD_TYPES} />
                        <EditField label="Allergies (comma separated)" name="allergies" value={form.allergies} onChange={handleChange} />
                      </div>
                    </Glass>
                  </div>
                )}

                {/* Personal info */}
                <Glass className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400 mb-3">Personal Info</p>
                  <InfoRow icon={Mail}     label="Email"  value={profile?.email}  accent="#6366f1" />
                  <InfoRow icon={Phone}    label="Phone"  value={profile?.phone}  accent="#8b5cf6" />
                  <InfoRow icon={Calendar} label="Age"    value={profile?.age != null ? `${profile.age} years old` : null} accent="#f43f5e" />
                  <InfoRow icon={Shield}   label="Gender" value={profile?.gender} accent="#10b981" />
                </Glass>

                {/* Medical card */}
                <Glass className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-rose-500 mb-4">Medical</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-rose-100"
                      style={{ background: "rgba(254,242,242,0.6)" }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
                        <Droplets size={18} className="text-white" />
                      </div>
                      <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Blood</p>
                      <p className="text-2xl font-black text-rose-700">{patient?.bloodtype || "—"}</p>
                    </div>
                    <div
                      className="flex flex-col gap-2 p-4 rounded-2xl border border-amber-100"
                      style={{ background: "rgba(255,251,235,0.6)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Allergies</p>
                      </div>
                      {patient?.allergies
                        ? <div className="flex flex-wrap gap-1">
                            {patient.allergies.split(",").map(a => a.trim()).filter(Boolean).map(a => (
                              <span key={a} className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200">{a}</span>
                            ))}
                          </div>
                        : <p className="text-amber-700 font-semibold text-xs">None recorded</p>
                      }
                    </div>
                  </div>
                </Glass>

                {/* Member since */}
                <Glass className="p-4 text-center">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400 mb-1">Member Since</p>
                  <p className="text-lg font-black text-slate-900">{fmt(patient?.createdAt)}</p>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {["#06b6d4", "#8b5cf6", "#f43f5e", "#10b981", "#f59e0b"].map((c, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c, opacity: 0.5 }} />
                    ))}
                  </div>
                </Glass>
              </div>

              {/* ════ RIGHT ════ */}
              <div ref={rightRef} className="flex flex-col gap-5">

                <Glass className="p-0 overflow-visible">
                  {/* Tab bar */}
                  <div
                    className="flex border-b border-white/30 rounded-t-[1.75rem] overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                  >
                    {tabs.map(t => {
                      const Icon   = t.icon;
                      const active = activeTab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setActiveTab(t.key)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-sm font-bold transition-all duration-200 relative ${active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          <Icon size={15} />
                          <span className="hidden sm:inline">{t.label}</span>
                          {t.count > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-all ${active ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {t.count}
                            </span>
                          )}
                          {active && <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>

                  <div ref={tabContentRef} className="p-5">
                    {activeTab === "appointments" && <AppointmentsTab appointments={appointments} />}
                    {activeTab === "surgeries"    && <SurgeriesTab    surgeries={surgeries} />}
                    {activeTab === "records"      && (
                      <RecordsTab
                        records={records}
                        onAddRecord={async () => {
                          try {
                            const { data: me } = await patientAPI.getMe();
                            setProfile(me);
                          } catch { /* silently fail */ }
                        }}
                      />
                    )}
                  </div>
                </Glass>

                {/* Quick-link cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { to: "/patient/appointments", label: "All Appointments", sub: `${appointments.length} total`, icon: CalendarDays, gradient: "from-violet-500 to-indigo-500" },
                    { to: "/patient/surgeries",    label: "All Surgeries",    sub: `${surgeries.length} total`,    icon: Scissors,     gradient: "from-rose-500 to-pink-500"     },
                  ].map(l => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-white/40 hover:border-white/70 hover:-translate-y-1 transition-all duration-200 shadow-md"
                      style={{ background: "rgba(255,255,255,0.46)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${l.gradient} flex items-center justify-center shadow-md`}>
                          <l.icon size={15} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{l.label}</p>
                          <p className="text-[10px] text-slate-500">{l.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}