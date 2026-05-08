import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Scissors,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  MapPin,
  Timer,
  Activity,
  Stethoscope,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";
import { surgeryAPI } from "../auth/api"; // adjust path to match your project

gsap.registerPlugin(ScrollTrigger);

// ─── Mock data (remove when API is wired) ────────────────────────────────────
const MOCK_SURGERIES = [
  {
    id: "1",
    surgeryType: "SCHEDULED",
    status: "PENDING",
    priority: "HIGH",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: 120,
    notes: "Patient must fast 8 hours before the procedure.",
    room: { name: "OR-4", floor: "3rd Floor" },
    surgeon: {
      specialization: "Cardiothoracic Surgery",
      user: {
        name: "Dr. Amira Hassan",
        img: "https://randomuser.me/api/portraits/women/44.jpg",
      },
    },
  },
  {
    id: "2",
    surgeryType: "URGENT",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    scheduledAt: new Date().toISOString(),
    estimatedDuration: 90,
    notes: "Urgent intervention required. ICU standby.",
    room: { name: "OR-1", floor: "2nd Floor" },
    surgeon: {
      specialization: "General Surgery",
      user: {
        name: "Dr. Karim Mostafa",
        img: "https://randomuser.me/api/portraits/men/32.jpg",
      },
    },
  },
  {
    id: "3",
    surgeryType: "SCHEDULED",
    status: "COMPLETED",
    priority: "MEDIUM",
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: 60,
    notes: "Surgery went smoothly. Recovery in room 204.",
    room: { name: "OR-2", floor: "2nd Floor" },
    surgeon: {
      specialization: "Orthopedic Surgery",
      user: {
        name: "Dr. Nour El-Din",
        img: "https://randomuser.me/api/portraits/men/65.jpg",
      },
    },
  },
  {
    id: "4",
    surgeryType: "EMERGENCY",
    status: "COMPLETED",
    priority: "CRITICAL",
    scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: 180,
    notes: "Emergency appendectomy. Patient stable post-op.",
    room: { name: "ER-OR", floor: "Ground Floor" },
    surgeon: {
      specialization: "Emergency Surgery",
      user: {
        name: "Dr. Sara Youssef",
        img: "https://randomuser.me/api/portraits/women/68.jpg",
      },
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const isUpcoming = (s) => s.status === "PENDING" || s.status === "IN_PROGRESS";
const isDone = (s) => s.status === "COMPLETED" || s.status === "CANCELLED";

const priorityConfig = {
  LOW:      { color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-400" },
  MEDIUM:   { color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-400"   },
  HIGH:     { color: "text-orange-600",  bg: "bg-orange-50",   border: "border-orange-200",  dot: "bg-orange-400"  },
  CRITICAL: { color: "text-rose-600",    bg: "bg-rose-50",     border: "border-rose-200",    dot: "bg-rose-500",   pulse: true },
};

const statusConfig = {
  PENDING:     { label: "Scheduled",   icon: Calendar,      gradient: "from-violet-500 to-indigo-500",  glow: "#6d28d9" },
  IN_PROGRESS: { label: "In Progress", icon: Activity,      gradient: "from-amber-500 to-orange-500",   glow: "#d97706" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2,  gradient: "from-emerald-500 to-teal-500",   glow: "#059669" },
  CANCELLED:   { label: "Cancelled",   icon: AlertTriangle, gradient: "from-slate-400 to-slate-500",    glow: "#64748b" },
};

const surgeryTypeConfig = {
  SCHEDULED: { label: "Scheduled", icon: Calendar },
  URGENT:    { label: "Urgent",    icon: Zap       },
  EMERGENCY: { label: "Emergency", icon: Shield    },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// ─── Doctor Floating Card ─────────────────────────────────────────────────────
function DoctorFloater({ surgeon, accent }) {
  const floaterRef = useRef(null);

  useEffect(() => {
    if (!floaterRef.current) return;
    gsap.to(floaterRef.current, {
      y: -10,
      duration: 2.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }, []);

  if (!surgeon?.user) return null;

  return (
    <div
      ref={floaterRef}
      className="absolute -top-6 -right-4 z-20 flex flex-col items-center gap-1 select-none pointer-events-none"
      style={{ filter: `drop-shadow(0 8px 24px ${accent}55)` }}
    >
      <div
        className="w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-xl"
        style={{ boxShadow: `0 0 0 3px ${accent}33` }}
      >
        {surgeon.user.img ? (
          <img
            src={surgeon.user.img}
            alt={surgeon.user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
            <Stethoscope size={20} className="text-white" />
          </div>
        )}
      </div>
      <div
        className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white text-center max-w-[100px] leading-tight"
        style={{ background: accent, boxShadow: `0 4px 12px ${accent}66` }}
      >
        {surgeon.user.name.replace("Dr. ", "Dr.\n")}
      </div>
    </div>
  );
}

// ─── Surgery Card ─────────────────────────────────────────────────────────────
function SurgeryCard({ surgery, index }) {
  const sc = statusConfig[surgery.status];
  const pc = priorityConfig[surgery.priority] || priorityConfig.MEDIUM;
  const tc = surgeryTypeConfig[surgery.surgeryType] || surgeryTypeConfig.SCHEDULED;
  const StatusIcon = sc.icon;
  const TypeIcon = tc.icon;

  return (
    <div
      className="surgery-card group relative overflow-visible"
      style={{ "--glow": sc.glow }}
    >
      {/* Doctor floater */}
      <DoctorFloater surgeon={surgery.surgeon} accent={sc.glow} />

      <div
        className="relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[2rem] p-7 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.46)",
          boxShadow: `0 4px 30px ${sc.glow}18`,
        }}
      >
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        {/* Hover gradient bloom */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${sc.gradient} transition-opacity duration-500 rounded-[2rem]`} />
        {/* Left accent bar */}
        <div className={`absolute top-6 left-0 w-1 h-14 bg-gradient-to-b ${sc.gradient} rounded-r-full`} />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 pr-14">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sc.gradient} flex items-center justify-center shadow-lg shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                style={{ boxShadow: `0 6px 18px ${sc.glow}40` }}
              >
                <StatusIcon className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-0.5">{sc.label}</p>
                <p className="text-lg font-black text-slate-900 leading-tight">
                  {surgery.surgeryType.charAt(0) + surgery.surgeryType.slice(1).toLowerCase()} Surgery
                </p>
              </div>
            </div>

            {/* Priority badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${pc.color} ${pc.bg} ${pc.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot} ${pc.pulse ? "animate-pulse" : ""}`} />
              {surgery.priority}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">{formatDate(surgery.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">{formatTime(surgery.scheduledAt)}</span>
            </div>
            {surgery.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Timer size={14} className="text-slate-400 shrink-0" />
                <span className="font-medium">{surgery.estimatedDuration} min</span>
              </div>
            )}
            {surgery.room && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span className="font-medium">{surgery.room.name} · {surgery.room.floor}</span>
              </div>
            )}
          </div>

          {/* Doctor info strip */}
          {surgery.surgeon?.user && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/50"
              style={{ background: "rgba(255,255,255,0.55)" }}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
                {surgery.surgeon.user.img ? (
                  <img src={surgery.surgeon.user.img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <Stethoscope size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-semibold">Your Surgeon</p>
                <p className="text-sm font-bold text-slate-800 truncate">{surgery.surgeon.user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{surgery.surgeon.specialization}</p>
              </div>
              <div className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-br ${sc.gradient} shrink-0`} />
            </div>
          )}

          {/* Surgery type pill */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gradient-to-r ${sc.gradient} text-white`}
              style={{ boxShadow: `0 2px 8px ${sc.glow}40` }}
            >
              <TypeIcon size={11} />
              {tc.label}
            </div>
            {surgery.notes && (
              <p className="text-xs text-slate-400 italic truncate max-w-[200px]">"{surgery.notes}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, gradient }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="text-white" size={18} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900">{label}</h2>
        <p className="text-sm text-slate-400 font-medium">{count} {count === 1 ? "surgery" : "surgeries"}</p>
      </div>
      <div className="ml-auto h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 rounded-[2rem] border border-dashed border-slate-200 backdrop-blur-sm"
      style={{ background: "rgba(255,255,255,0.3)" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Scissors size={28} className="text-slate-300" />
      </div>
      <p className="text-slate-400 font-semibold text-lg">No {label} surgeries</p>
      <p className="text-slate-400 text-sm">You're all clear here.</p>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ surgeries }) {
  const total     = surgeries.length;
  const completed = surgeries.filter(s => s.status === "COMPLETED").length;
  const pending   = surgeries.filter(s => s.status === "PENDING").length;
  const active    = surgeries.filter(s => s.status === "IN_PROGRESS").length;

  const stats = [
    { label: "Total",       value: total,     gradient: "from-cyan-500 to-blue-500",    glow: "#06b6d4" },
    { label: "Completed",   value: completed, gradient: "from-emerald-500 to-teal-500", glow: "#10b981" },
    { label: "Upcoming",    value: pending,   gradient: "from-violet-500 to-indigo-500", glow: "#7c3aed" },
    { label: "In Progress", value: active,    gradient: "from-amber-500 to-orange-500", glow: "#d97706" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
      {stats.map((s) => (
        <div
          key={s.label}
          className="stat-pill relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[1.5rem] p-5 shadow-lg"
          style={{ background: "rgba(255,255,255,0.46)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-1">{s.label}</p>
          <p className={`text-4xl font-black bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}>{s.value}</p>
          <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ background: s.glow }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientSurgeries() {
  const wrapperRef  = useRef(null);
  const heroRef     = useRef(null);
  const progressRef = useRef(null);

  const [surgeries, setSurgeries]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
useEffect(() => {
  const load = async () => {
    try {
      const { data } = await surgeryAPI.getMyStudentSurgeries();
      setSurgeries(data);
    } catch (err) {
      setError("Could not load surgeries.");
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);

  // ── GSAP ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.set([".hero-badge", ".hero-title", ".hero-body", ".stat-pill", ".surgery-card"], {
        willChange: "transform, opacity",
      });

      // Hero
      gsap.timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-badge",  { opacity: 0, y: 20 },              { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(".hero-title",  { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.1 }, "-=0.4")
        .fromTo(".hero-body",   { opacity: 0, y: 28 },              { opacity: 1, y: 0, duration: 0.9 }, "-=0.6");

      // Parallax exit
      gsap.to(heroRef.current, {
        y: -80, opacity: 0.3, scale: 0.96, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 },
      });

      // Stats stagger
      gsap.fromTo(".stat-pill",
        { opacity: 0, y: 30, scale: 0.92 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.55, stagger: 0.08, ease: "power2.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".stat-pill", start: "top 88%", once: true },
        }
      );

      // Surgery cards stagger
      gsap.fromTo(".surgery-card",
        { opacity: 0, y: 40, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5, stagger: 0.09, ease: "power2.out",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: ".surgery-card", start: "top 85%", once: true },
        }
      );

      // Ambient glow parallax
      gsap.to(".glow-tl", { y: 130, x: 40, ease: "none", scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 } });
      gsap.to(".glow-br", { y: -130, x: -40, ease: "none", scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 } });

      // Scroll progress
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom bottom", scrub: 0 },
      });

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading]);

  const upcoming = surgeries.filter(isUpcoming);
  const done     = surgeries.filter(isDone);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed", top: 0, left: 0,
          height: "3px", width: "100%",
          transformOrigin: "left center", transform: "scaleX(0)",
          background: "linear-gradient(90deg,#f43f5e,#a855f7,#06b6d4)",
          zIndex: 9999, borderRadius: "0 2px 2px 0", pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{ backgroundImage: NOISE + ", linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)" }}
      >
        {/* Ambient glows */}
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[40rem] h-[40rem] rounded-full bg-rose-400/15 blur-[110px]" />
        <div className="glow-br pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[40rem] h-[40rem] rounded-full bg-violet-500/15 blur-[110px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 pb-40">

          {/* ── HERO ─────────────────────────────────────────────────── */}
          <section ref={heroRef} className="min-h-[52vh] flex items-center pt-16 pb-6">
            <div className="w-full max-w-4xl">
              {/* Back link */}
              <Link
                to="/patient"
                className="hero-badge inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 group"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Link>

              <div
                className="relative backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] p-10 md:p-14 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.46)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-gradient-to-br from-rose-400/25 to-violet-400/15 blur-2xl pointer-events-none" />

                <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 text-rose-700 text-sm font-semibold border border-rose-400/30 tracking-wide mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  My Surgeries
                </span>

                <h1 className="hero-title text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-5">
                  Your Surgical{" "}
                  <span className="bg-gradient-to-r from-rose-500 to-violet-600 bg-clip-text text-transparent">
                    Journey
                  </span>{" "}
                  <Scissors className="inline text-rose-400 mb-1" size={52} />
                </h1>

                <p className="hero-body text-slate-600 text-xl md:text-2xl max-w-2xl leading-relaxed">
                  Track all your upcoming and completed procedures, your surgeons, and recovery notes — all in one place.
                </p>
              </div>
            </div>
          </section>

          {/* ── CONTENT ───────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
                <p className="text-slate-400 font-semibold">Loading your surgeries…</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-40">
              <div
                className="text-center px-10 py-10 rounded-[2rem] border border-rose-200 backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <AlertTriangle size={40} className="text-rose-400 mx-auto mb-3" />
                <p className="text-slate-700 font-bold text-xl">{error}</p>
                <p className="text-slate-400 text-sm mt-1">Please try refreshing the page.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <StatsBar surgeries={surgeries} />

              {/* ── Upcoming ──────────────────────────────────────────── */}
              <section className="mb-20">
                <SectionHeader
                  icon={Clock}
                  label="Upcoming Surgeries"
                  count={upcoming.length}
                  gradient="from-violet-500 to-indigo-500"
                />
                {upcoming.length === 0 ? (
                  <EmptyState label="upcoming" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
                    {upcoming.map((s, i) => (
                      <SurgeryCard key={s.id} surgery={s} index={i} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Done ──────────────────────────────────────────────── */}
              <section>
                <SectionHeader
                  icon={CheckCircle2}
                  label="Past Surgeries"
                  count={done.length}
                  gradient="from-emerald-500 to-teal-500"
                />
                {done.length === 0 ? (
                  <EmptyState label="past" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
                    {done.map((s, i) => (
                      <SurgeryCard key={s.id} surgery={s} index={i} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}