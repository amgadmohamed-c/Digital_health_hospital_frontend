import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  Camera,
  Stethoscope,
  Briefcase,
  Building2,
  Clock3,
  BadgeCheck,
  CalendarDays,
  Activity,
  Scissors,
  Clock,
  CheckCheck,
  XCircle,
  AlertTriangle,
  Timer,
  RefreshCw,
} from "lucide-react";

import { doctorAPI, surgeryAPI } from "../auth/api"; // adjust path

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────────────────────────
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Status configs ───────────────────────────────────────────────────────────
const APPT_STATUS = {
  SCHEDULED: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", icon: Clock },
  ACTIVE:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: Activity },
  COMPLETED: { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400",  icon: CheckCheck },
  CANCELLED: { bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400",    icon: XCircle },
};

const SURGERY_STATUS = {
  PENDING:     { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",  icon: Timer },
  IN_PROGRESS: { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",   icon: Activity },
  COMPLETED:   { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500",icon: CheckCheck },
  CANCELLED:   { bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400",    icon: XCircle },
};

const PRIORITY_COLOR = {
  LOW:      "text-slate-500 bg-slate-100",
  MEDIUM:   "text-yellow-700 bg-yellow-100",
  HIGH:     "text-orange-700 bg-orange-100",
  CRITICAL: "text-red-700 bg-red-100",
};

const SURGERY_TYPE_COLOR = {
  SCHEDULED: "text-violet-700 bg-violet-100",
  URGENT:    "text-orange-700 bg-orange-100",
  EMERGENCY: "text-red-700 bg-red-100",
};

// ─── Glass card ───────────────────────────────────────────────────────────────
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
function EditField({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">{label}</label>
      <input
        type={type} name={name} value={value || ""} onChange={onChange}
        className="w-full px-3 py-2.5 rounded-xl border border-white/50 text-slate-800 font-semibold text-sm outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20 transition-all"
        style={{ background: "rgba(255,255,255,0.65)" }}
      />
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, accent = "#06b6d4" }) {
  return (
    <div className="info-row-anim flex items-center gap-3 py-2.5 border-b border-white/30 last:border-0 group">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${accent}18`, boxShadow: `0 2px 8px ${accent}20` }}
      >
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">{label}</p>
        <p className="text-slate-800 font-semibold text-sm truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Appointment row ──────────────────────────────────────────────────────────
function ApptRow({ appt }) {
  const cfg = APPT_STATUS[appt.status] ?? APPT_STATUS.SCHEDULED;
  const Icon = cfg.icon;
  return (
    <div className="appt-row flex items-start gap-3 p-3 rounded-2xl border border-white/40 hover:border-white/70 hover:shadow-md transition-all duration-200 group"
      style={{ background: "rgba(255,255,255,0.5)" }}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon size={13} className={cfg.text} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800 truncate">
            {appt.patient?.user?.name ?? appt.patientId?.slice(0, 8) ?? "Patient"}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {appt.status}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CalendarDays size={10} />
            {fmtDateTime(appt.scheduledAt)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
            {appt.type}
          </span>
          {appt.durationMinutes && (
            <span className="text-[10px] text-slate-400">{appt.durationMinutes}min</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Surgery row ──────────────────────────────────────────────────────────────
function SurgeryRow({ surgery }) {
  const cfg = SURGERY_STATUS[surgery.surgeryStatus] ?? SURGERY_STATUS.PENDING;
  const Icon = cfg.icon;
  const priColor = PRIORITY_COLOR[surgery.priority] ?? PRIORITY_COLOR.LOW;
  const typeColor = SURGERY_TYPE_COLOR[surgery.type] ?? SURGERY_TYPE_COLOR.SCHEDULED;

  return (
    <div className="surgery-row flex items-start gap-3 p-3 rounded-2xl border border-white/40 hover:border-white/70 hover:shadow-md transition-all duration-200"
      style={{ background: "rgba(255,255,255,0.5)" }}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon size={13} className={cfg.text} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800 truncate">
            {surgery.patient?.user?.name ?? surgery.patientId?.slice(0, 8) ?? "Patient"}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {surgery.surgeryStatus}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${typeColor}`}>
            {surgery.type}
          </span>
          {surgery.priority && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${priColor}`}>
              {surgery.priority}
            </span>
          )}
          {surgery.scheduledAt && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              {fmtTime(surgery.scheduledAt)}
            </span>
          )}
          {surgery.estimatedDuration && (
            <span className="text-[10px] text-slate-400">{surgery.estimatedDuration}min</span>
          )}
        </div>
        {surgery.room && (
          <p className="text-[10px] text-slate-400 mt-0.5">Room {surgery.room?.number ?? surgery.room?.name ?? surgery.roomId?.slice(0,8)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className="text-xs text-slate-400 font-medium">{message}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DoctorProfile() {
  const wrapperRef   = useRef(null);
  const progressRef  = useRef(null);
  const avatarRef    = useRef(null);
  const ringRef      = useRef(null);
  const leftRef      = useRef(null);
  const rightRef     = useRef(null);
  const editRef      = useRef(null);
  const fileInputRef = useRef(null);

  const [doctor,     setDoctor]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [imgFile,    setImgFile]    = useState(null);
  const [form,       setForm]       = useState({ name: "", phone: "", specialty: "", department:"Surgery", location: "Cairo", experience: "" });

  // ── New: data lists ──────────────────────────────────────────────────────────
  const [appointments,    setAppointments]    = useState([]);
  const [surgeries,       setSurgeries]       = useState([]);
  const [loadingAppts,    setLoadingAppts]    = useState(true);
  const [loadingSurgeries,setLoadingSurgeries]= useState(true);

  // ─── Fetch doctor ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await doctorAPI.getMe();
        setDoctor(data);
        setForm({
          name:        data.name || "",
          phone:       data.phone || "",
          specialty:   data.doctorProfile?.specialization || "",
          department:  data.doctorProfile?.department || "SURGERY",
          location:    data.doctorProfile?.location || "",
          experience:  data.doctorProfile?.experience || "",
        });

        // fetch appointments using doctorProfile id
        const doctorProfileId = data.doctorProfile?.id;
        if (doctorProfileId) {
          doctorAPI.getAvailableSlots(doctorProfileId)
            .then((res) => {
              // getAvailableSlots returns time slots; we use them to show today's schedule
              const slots = Array.isArray(res.data) ? res.data : [];
              setAppointments(slots);
            })
            .catch(() => setAppointments([]))
            .finally(() => setLoadingAppts(false));
        } else {
          setLoadingAppts(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();

    // fetch today's surgeries independently
    surgeryAPI.getTodaySurgeries()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setSurgeries(list);
      })
      .catch(() => setSurgeries([]))
      .finally(() => setLoadingSurgeries(false));
  }, []);

  // ─── GSAP ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !wrapperRef.current) return;
    ScrollTrigger.getAll().forEach((t) => t.kill());

    const ctx = gsap.context(() => {
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom bottom", scrub: 0 },
      });

      gsap.fromTo(avatarRef.current,
        { opacity: 0, y: -50, scale: 0.5, rotation: -20 },
        { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 1.1, ease: "back.out(2)", delay: 0.15 }
      );

      gsap.fromTo(ringRef.current,
        { opacity: 0, scale: 0, rotation: -120 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "back.out(1.8)", delay: 0.65 }
      );
      gsap.to(ringRef.current, { rotation: 360, duration: 18, ease: "none", repeat: -1, delay: 1.5 });

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

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading]);

  // Edit panel animation
  useEffect(() => {
    if (!editRef.current || !editing) return;
    gsap.fromTo(editRef.current,
      { opacity: 0, y: -16, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
  }, [editing]);

  // Animate list rows when data arrives
  useEffect(() => {
    if (!loadingAppts && appointments.length > 0) {
      setTimeout(() => {
        gsap.fromTo(".appt-row",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
        );
      }, 50);
    }
  }, [loadingAppts, appointments]);

  useEffect(() => {
    if (!loadingSurgeries && surgeries.length > 0) {
      setTimeout(() => {
        gsap.fromTo(".surgery-row",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
        );
      }, 50);
    }
  }, [loadingSurgeries, surgeries]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

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
      Object.entries(form).forEach(([k, v]) => { if (v !== "" && v != null) fd.append(k, v); });
      if (imgFile) fd.append("profile", imgFile);
      await doctorAPI.editProfile(fd);
      const { data } = await doctorAPI.getMe();
      setDoctor(data);
      setEditing(false);
      setSaved(true);
      setPreviewImg(null);
      setImgFile(null);
      gsap.fromTo(avatarRef.current, { scale: 1 }, { scale: 1.14, duration: 0.18, yoyo: true, repeat: 3, ease: "power2.inOut" });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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

  const refreshSurgeries = () => {
    setLoadingSurgeries(true);
    surgeryAPI.getTodaySurgeries()
      .then((res) => setSurgeries(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSurgeries([]))
      .finally(() => setLoadingSurgeries(false));
  };

  const avatarSrc = previewImg || doctor?.doctorProfile?.img;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
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
        <div className="pointer-events-none fixed top-[-8rem] left-[-8rem] w-[36rem] h-[36rem] rounded-full bg-cyan-400/20 blur-[110px]" />
        <div className="pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full bg-violet-500/20 blur-[110px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-12 py-8 pb-28">
          <Link
            to="/doctor"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
          >
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

              {/* ══════════ LEFT ══════════ */}
              <div ref={leftRef} className="flex flex-col gap-5 lg:sticky lg:top-6">

                {/* Avatar card */}
                <Glass className="p-6 flex flex-col items-center text-center">
                  <div ref={avatarRef} className="relative mb-5">
                    <div
                      ref={ringRef}
                      className="absolute pointer-events-none"
                      style={{
                        inset: "-5px", borderRadius: "9999px", padding: "3px",
                        background: "conic-gradient(from 0deg,#06b6d4,#8b5cf6,#f43f5e,#10b981,#06b6d4)",
                      }}
                    >
                      <div className="w-full h-full rounded-full" style={{ background: "#f0f9ff" }} />
                    </div>
                    <div
                      className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl z-10"
                      style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.9),0 16px 48px rgba(6,182,212,0.28)" }}
                    >
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="doctor" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
                          <User size={44} className="text-white opacity-80" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white hover:scale-110 transition-transform"
                      style={{ boxShadow: "0 4px 12px rgba(6,182,212,0.4)" }}
                    >
                      <Camera size={13} className="text-cyan-600" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImgChange} />
                  </div>

                  <h1 className="text-2xl font-black text-slate-900 mb-2">{doctor?.name || "Doctor"}</h1>

                  <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 text-[11px] font-bold border border-cyan-400/30">
                      <BadgeCheck size={10} /> DOCTOR
                    </span>
                    {doctor?.doctorProfile?.specialization && (
                      <span className="px-2.5 py-1 rounded-full bg-violet-500/12 text-violet-700 text-[11px] font-bold border border-violet-300/25">
                        {doctor.doctorProfile.specialization}
                      </span>
                    )}
                    {doctor?.doctorProfile?.experience && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                        {doctor.doctorProfile.experience} yrs
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
                          onClick={handleSave} disabled={saving}
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
                        <EditField label="Full Name"   name="name"       value={form.name}       onChange={handleChange} />
                        <EditField label="Phone"       name="phone"      value={form.phone}      onChange={handleChange} />
                        <EditField label="Specialty"   name="specialty"  value={form.specialty}  onChange={handleChange} />
                        <EditField label="Department"  name="department" value={"SURGERY"} onChange={handleChange} />
                        <EditField label="Location"    name="location"   value={"SURGERY"}   onChange={handleChange} />
                        <EditField label="Experience"  name="experience" value={form.experience} onChange={handleChange} type="number" />
                      </div>
                    </Glass>
                  </div>
                )}

                {/* Professional info */}
                <Glass className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400 mb-3">Professional Info</p>
                  <InfoRow icon={Mail}      label="Email"      value={doctor?.email}                            accent="#6366f1" />
                  <InfoRow icon={Phone}     label="Phone"      value={doctor?.phone}                            accent="#8b5cf6" />
                  <InfoRow icon={Stethoscope} label="Specialty" value={doctor?.doctorProfile?.specialization}  accent="#06b6d4" />
                  <InfoRow icon={Building2} label="Department" value={"SURGERY"}        accent="#f43f5e" />
                  <InfoRow icon={MapPin}    label="Location"   value={"SURGERY"}         accent="#10b981" />
                </Glass>

                {/* Stats */}
                <Glass className="p-5">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-cyan-500 mb-4">Career</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-cyan-100" style={{ background: "rgba(236,254,255,0.6)" }}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                        <Clock3 size={18} className="text-white" />
                      </div>
                      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Experience</p>
                      <p className="text-2xl font-black text-cyan-700">{doctor?.doctorProfile?.experience || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-2 p-4 rounded-2xl border border-violet-100" style={{ background: "rgba(245,243,255,0.6)" }}>
                      <div className="flex items-center gap-1.5">
                        <Award size={12} className="text-violet-500" />
                        <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">Specialty</p>
                      </div>
                      <p className="text-violet-700 font-semibold text-xs leading-relaxed">
                        {doctor?.doctorProfile?.specialization || "Not added"}
                      </p>
                    </div>
                  </div>
                </Glass>

                {/* Joined */}
                <Glass className="p-4 text-center">
                  <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-slate-400 mb-1">Joined</p>
                  <p className="text-lg font-black text-slate-900">{fmt(doctor?.doctorProfile?.createdAt)}</p>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {["#06b6d4","#8b5cf6","#f43f5e","#10b981","#f59e0b"].map((c, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c, opacity: 0.5 }} />
                    ))}
                  </div>
                </Glass>
              </div>

              {/* ══════════ RIGHT ══════════ */}
              <div ref={rightRef} className="flex flex-col gap-5">

                {/* Hero welcome */}
                <Glass className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-300/30 text-cyan-700 text-xs font-bold mb-4">
                        <Activity size={12} /> ACTIVE DOCTOR PROFILE
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 leading-tight">
                        Welcome back,<br />Dr. {doctor?.name?.split(" ")[0]}
                      </h2>
                      <p className="text-slate-500 mt-3 max-w-xl">
                        Manage your professional profile, update your information, and keep your medical presence up to date.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                      <div className="rounded-2xl p-4 border border-white/40" style={{ background: "rgba(255,255,255,0.45)" }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center mb-3">
                          <Briefcase size={18} className="text-white" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                        <h3 className="text-2xl font-black text-slate-900">{doctor?.doctorProfile?.experience || 0}</h3>
                      </div>
                      <div className="rounded-2xl p-4 border border-white/40" style={{ background: "rgba(255,255,255,0.45)" }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-3">
                          <Stethoscope size={18} className="text-white" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2">
                          {doctor?.doctorProfile?.department || "SURGERY"}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Glass>

                {/* ── Appointments + Surgeries side by side ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Appointments */}
                  <Glass className="flex flex-col" style={{ minHeight: "420px" }}>
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-md">
                          <CalendarDays size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Today's Slots</p>
                          <p className="text-[10px] text-slate-400">
                            {loadingAppts ? "Loading…" : `${appointments.length} slot${appointments.length !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-violet-600 bg-violet-50 border border-violet-200 px-2 py-1 rounded-lg">
                        Schedule
                      </span>
                    </div>

                    <div className="px-4 pb-5 flex-1 overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: "thin" }}>
                      {loadingAppts ? (
                        <div className="flex-1 flex items-center justify-center">
                          <Loader2 size={22} className="text-violet-400 animate-spin" />
                        </div>
                      ) : appointments.length === 0 ? (
                        <EmptyState icon={CalendarDays} message="No slots set for today" />
                      ) : (
                        appointments.map((slot, i) => (
                          <div
                            key={i}
                            className="appt-row flex items-center gap-3 p-3 rounded-2xl border border-white/40 hover:shadow-md transition-all"
                            style={{ background: slot.taken ? "rgba(248,248,252,0.6)" : "rgba(240,253,244,0.7)" }}
                          >
                            <div className={`w-2 h-8 rounded-full flex-shrink-0 ${slot.taken ? "bg-red-400" : "bg-emerald-400"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">
                                {fmtTime(slot.startTime)} — {fmtTime(slot.endTime)}
                              </p>
                              <p className={`text-[11px] font-semibold ${slot.taken ? "text-red-500" : "text-emerald-600"}`}>
                                {slot.taken ? "Booked" : "Available"}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${slot.taken ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                              {slot.taken ? "●" : "○"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Glass>

                  {/* Today's Surgeries */}
                  <Glass className="flex flex-col" style={{ minHeight: "420px" }}>
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                          <Scissors size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Today's Surgeries</p>
                          <p className="text-[10px] text-slate-400">
                            {loadingSurgeries ? "Loading…" : `${surgeries.length} surger${surgeries.length !== 1 ? "ies" : "y"}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={refreshSurgeries}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw size={13} className={loadingSurgeries ? "animate-spin" : ""} />
                      </button>
                    </div>

                    <div className="px-4 pb-5 flex-1 overflow-y-auto flex flex-col gap-2" style={{ scrollbarWidth: "thin" }}>
                      {loadingSurgeries ? (
                        <div className="flex-1 flex items-center justify-center">
                          <Loader2 size={22} className="text-rose-400 animate-spin" />
                        </div>
                      ) : surgeries.length === 0 ? (
                        <EmptyState icon={Scissors} message="No surgeries scheduled today" />
                      ) : (
                        surgeries.map((s) => <SurgeryRow key={s.id} surgery={s} />)
                      )}
                    </div>
                  </Glass>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}