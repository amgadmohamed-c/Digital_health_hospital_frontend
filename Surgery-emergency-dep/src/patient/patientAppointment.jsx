import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarDays,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  MapPin,
  Stethoscope,
  Video,
  Building2,
  ChevronRight,
  CalendarX,
  Timer,
  Zap,
  Search,
  Plus,
  X 
} from "lucide-react";
import { patientAPI ,doctorAPI} from "../auth/api";

gsap.registerPlugin(ScrollTrigger);

// ─── Noise texture (matches dashboard) ───────────────────────────────────────
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

// ─── Config maps ──────────────────────────────────────────────────────────────
const statusConfig = {
  SCHEDULED: {
    label: "Scheduled",
    icon: CalendarDays,
    gradient: "from-violet-500 to-indigo-500",
    glow: "#7c3aed",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  ACTIVE: {
    label: "Active",
    icon: Activity,
    gradient: "from-amber-500 to-orange-500",
    glow: "#d97706",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    pulse: true,
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-500",
    glow: "#059669",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    gradient: "from-slate-400 to-slate-500",
    glow: "#94a3b8",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

const typeConfig = {
  HOSPITAL: { label: "In-Person", icon: Building2, color: "text-cyan-600",   bg: "bg-cyan-50",   border: "border-cyan-200"   },
  ONLINE:   { label: "Online",    icon: Video,      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isUpcoming = (a) => a.status === "SCHEDULED" || a.status === "ACTIVE";
const isPast     = (a) => a.status === "COMPLETED" || a.status === "CANCELLED";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── Doctor Floater (same pattern as surgeries page) ─────────────────────────
function DoctorFloater({ doctor, glow }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.to(ref.current, { y: -10, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }, []);

  if (!doctor?.user) return null;
  return (
    <div
      ref={ref}
      className="absolute -top-5 -right-3 z-20 flex flex-col items-center gap-1 select-none pointer-events-none"
      style={{ filter: `drop-shadow(0 8px 20px ${glow}55)` }}
    >
      <div
        className="w-12 h-12 rounded-2xl border-2 border-white overflow-hidden shadow-xl"
        style={{ boxShadow: `0 0 0 3px ${glow}33` }}
      >
        {doctor.img ? (
          <img src={doctor.img} alt={doctor.user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <Stethoscope size={18} className="text-slate-500" />
          </div>
        )}
      </div>
      <div
        className="px-2 py-0.5 rounded-xl text-[10px] font-bold text-white text-center max-w-[96px] leading-tight"
        style={{ background: glow, boxShadow: `0 4px 10px ${glow}55` }}
      >
        {doctor.user.name}
      </div>
    </div>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ appointment }) {
  const sc = statusConfig[appointment.status] ?? statusConfig.SCHEDULED;
  const tc = typeConfig[appointment.type]     ?? typeConfig.HOSPITAL;
  const StatusIcon = sc.icon;
  const TypeIcon   = tc.icon;

  const duration = appointment.durationMinutes ?? 30;

  return (
    <div className="appt-card group relative overflow-visible">
      <DoctorFloater doctor={appointment.doctor} glow={sc.glow} />

      <div
        className="relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[2rem] p-7 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.46)",
          boxShadow: `0 4px 28px ${sc.glow}18`,
        }}
      >
        {/* Shimmer top edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        {/* Hover bloom */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${sc.gradient} transition-opacity duration-500 rounded-[2rem]`} />
        {/* Left accent */}
        <div className={`absolute top-6 left-0 w-1 h-14 bg-gradient-to-b ${sc.gradient} rounded-r-full`} />

        <div className="relative z-10 flex flex-col gap-5 pr-12">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sc.gradient} flex items-center justify-center shadow-lg shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                style={{ boxShadow: `0 6px 18px ${sc.glow}40` }}
              >
                <StatusIcon className="text-white" size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-0.5">{sc.label}</p>
                <p className="text-lg font-black text-slate-900 leading-tight">
                  {appointment.doctor?.department?.name ?? "Appointment"}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.text} ${sc.bg} ${sc.border} shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.pulse ? "animate-pulse" : ""}`} />
              {sc.label}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">{formatDate(appointment.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">{formatTime(appointment.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Timer size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">{duration} min</span>
            </div>
            {appointment.endsAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Zap size={14} className="text-slate-400 shrink-0" />
                <span className="font-medium">Ends {formatTime(appointment.endsAt)}</span>
              </div>
            )}
          </div>

          {/* Doctor strip */}
          {appointment.doctor?.user && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/50"
              style={{ background: "rgba(255,255,255,0.55)" }}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
                {appointment.doctor.img ? (
                  <img src={appointment.doctor.img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Stethoscope size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-semibold">Your Doctor</p>
                <p className="text-sm font-bold text-slate-800 truncate">{appointment.doctor.user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{appointment.doctor.specialization}</p>
              </div>
              <div className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-br ${sc.gradient} shrink-0`} />
            </div>
          )}

          {/* Type pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${tc.color} ${tc.bg} ${tc.border}`}>
              <TypeIcon size={11} />
              {tc.label}
            </div>
            {appointment.type === "ONLINE" && appointment.status === "ACTIVE" && (
              <Link
                to={`/patient/chat?appointmentId=${appointment.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md hover:shadow-lg transition-shadow"
              >
                <Video size={11} />
                Join Now
                <ChevronRight size={10} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, gradient }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="text-white" size={18} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900">{label}</h2>
        <p className="text-sm text-slate-400 font-medium">
          {count} {count === 1 ? "appointment" : "appointments"}
        </p>
      </div>
      <div className="ml-4 h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 rounded-[2rem] border border-dashed border-slate-200"
      style={{ background: "rgba(255,255,255,0.3)" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <CalendarX size={28} className="text-slate-300" />
      </div>
      <p className="text-slate-400 font-semibold text-lg">{message}</p>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ appointments }) {
  const total     = appointments.length;
  const scheduled = appointments.filter(a => a.status === "SCHEDULED").length;
  const active    = appointments.filter(a => a.status === "ACTIVE").length;
  const completed = appointments.filter(a => a.status === "COMPLETED").length;

  const stats = [
    { label: "Total",     value: total,     gradient: "from-cyan-500 to-blue-500",     glow: "#06b6d4" },
    { label: "Scheduled", value: scheduled, gradient: "from-violet-500 to-indigo-500", glow: "#7c3aed" },
    { label: "Active",    value: active,    gradient: "from-amber-500 to-orange-500",  glow: "#d97706" },
    { label: "Completed", value: completed, gradient: "from-emerald-500 to-teal-500",  glow: "#059669" },
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
export default function PatientAppointments() {
  const wrapperRef  = useRef(null);
  const heroRef     = useRef(null);
  const progressRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointmentType, setAppointmentType] =
  useState("HOSPITAL");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Route: GET /patient/:id/appointments
        // The controller reads patientId from JWT so we pass the user's own id.
        // If you store the user id in localStorage after login, read it here:
        const userId = localStorage.getItem("userId"); // set this at login
        const { data } = await patientAPI.getMyAppointments(userId);
        const doctorsRes = await patientAPI.getAvailableDoctors("SURGERY");
        setDoctors(doctorsRes.data);
        setAppointments(data);
      } catch (err) {
        setError("Could not load appointments.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


const handleBookAppointment = async () => {
  if (!selectedDoctor || !selectedSlot) return;

  try {
    setBookingLoading(true);

    // This payload matches your controller's logic
    const payload = {
      doctorId: selectedDoctor.id,
      slotId: selectedSlot.id,
      scheduledAt: selectedSlot.startTime, // Pass the time from the slot
      type: appointmentType,               // "HOSPITAL" or "ONLINE"
      status: "SCHEDULED"                  // Default status
    };

    await doctorAPI.bookAppointment(payload);

    setBookingModal(false);
    setSelectedSlot(null);
    
    // Refresh your list
    const userId = localStorage.getItem("userId");
    const { data } = await patientAPI.getMyAppointments(userId);
    setAppointments(data);
  } catch (err) {
    console.error("Error booking:", err.response?.data?.err || err.message);
  } finally {
    setBookingLoading(false);
  }
};
  // ── GSAP ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.set([".hero-badge", ".hero-title", ".hero-body", ".stat-pill", ".appt-card"], {
        willChange: "transform, opacity",
      });

      gsap.timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-badge",  { opacity: 0, y: 20 },              { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(".hero-title",  { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.1 }, "-=0.4")
        .fromTo(".hero-body",   { opacity: 0, y: 28 },              { opacity: 1, y: 0, duration: 0.9 }, "-=0.6");

      gsap.to(heroRef.current, {
        y: -80, opacity: 0.3, scale: 0.96, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 },
      });

      gsap.fromTo(".stat-pill",
        { opacity: 0, y: 30, scale: 0.92 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5, stagger: 0.08, ease: "power2.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".stat-pill", start: "top 88%", once: true },
        }
      );

      gsap.fromTo(".appt-card",
        { opacity: 0, y: 40, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5, stagger: 0.09, ease: "power2.out",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: ".appt-card", start: "top 85%", once: true },
        }
      );

      gsap.to(".glow-tl", { y: 120, x: 40, ease: "none", scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 } });
      gsap.to(".glow-br", { y: -120, x: -40, ease: "none", scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 } });

      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom bottom", scrub: 0 },
      });
      gsap.fromTo(
        ".doctor-card",
      {
          opacity: 0,
          y: 50,
           scale: 0.94,
       },
      {
       opacity: 1,
       y: 0,
       scale: 1,
       stagger: 0.08,
       duration: 0.6,
       ease: "power4.out",
       scrollTrigger: {
       trigger: ".doctor-card",
       start: "top 85%",
    },
  }
);

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading]);

  const upcoming = appointments.filter(isUpcoming);
  const past     = appointments.filter(isPast);
const filteredSlots =
  selectedDoctor?.availableSlots || [];

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed", top: 0, left: 0,
          height: "3px", width: "100%",
          transformOrigin: "left center", transform: "scaleX(0)",
          background: "linear-gradient(90deg,#7c3aed,#06b6d4,#10b981)",
          zIndex: 9999, borderRadius: "0 2px 2px 0", pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{ backgroundImage: NOISE + ", linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)" }}
      >
        {/* Ambient glows */}
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[40rem] h-[40rem] rounded-full bg-violet-400/15 blur-[110px]" />
        <div className="glow-br pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[40rem] h-[40rem] rounded-full bg-cyan-500/15 blur-[110px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 pb-40">

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <section ref={heroRef} className="min-h-[52vh] flex items-center pt-16 pb-6">
            <div className="w-full max-w-4xl">
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
                <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-gradient-to-br from-violet-400/25 to-cyan-400/15 blur-2xl pointer-events-none" />

                <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 text-violet-700 text-sm font-semibold border border-violet-400/30 tracking-wide mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  My Appointments
                </span>

                <h1 className="hero-title text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-5">
                  Your{" "}
                  <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                    Care
                  </span>{" "}
                  Schedule{" "}
                  <CalendarDays className="inline text-violet-400 mb-1" size={52} />
                </h1>

                <p className="hero-body text-slate-600 text-xl md:text-2xl max-w-2xl leading-relaxed">
                  View all your upcoming and past appointments, your doctors, and join
                  online sessions — all in one place.
                </p>
              </div>
            </div>
          </section>
          {/* BOOK APPOINTMENT SECTION */}
<section className="mb-24">
  <div className="flex items-center gap-4 mb-10">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-xl">
      <Plus className="text-white" size={20} />
    </div>

    <div>
      <h2 className="text-3xl font-black text-slate-900">
        Book Appointment
      </h2>

      <p className="text-slate-400 font-medium">
        Choose your doctor and reserve a slot
      </p>
    </div>

    <div className="h-px flex-1 bg-gradient-to-r from-slate-300/60 to-transparent ml-4" />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
    {doctors.map((doctor) => (
      <div
        key={doctor.id}
        className="doctor-card group relative overflow-hidden rounded-[2rem] border border-white/40 backdrop-blur-2xl p-7 shadow-xl hover:-translate-y-2 transition-all duration-500"
        style={{
          background: "rgba(255,255,255,0.48)",
        }}
      >
        {/* glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-violet-500/10 to-cyan-500/10" />

        {/* shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        <div className="relative z-10">
          {/* doctor */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-violet-500/30 blur-xl" />

              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                {doctor.img ? (
                  <img
                    src={doctor.img}
                    alt={doctor.user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center">
                    <Stethoscope className="text-violet-500" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">
                {doctor.user?.name}
              </h3>

              <p className="text-violet-600 font-semibold">
                {doctor.specialization}
              </p>

              <p className="text-sm text-slate-400">
                {doctor.department?.name}
              </p>
            </div>
          </div>

          {/* info */}
          <div className="space-y-3 mb-7">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} />
              Cairo Medical Center
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={14} />
              {doctor.availableSlots?.length || 0} slots available
            </div>
          </div>

          {/* button */}
          <button
onClick={async () => {
  try {
    console.log("doctor id:", doctor.id);

    const slotsRes =
      await doctorAPI.getAvailableSlots(doctor.id);

    console.log("slots:", slotsRes.data);

    setSelectedDoctor({
      ...doctor,
      availableSlots: slotsRes.data,
    });

    setSelectedSlot(null);
    setAppointmentType("HOSPITAL");

    setBookingModal(true);

  } catch (err) {
    console.error("FAILED:", err);
  }
}}
            className="w-full relative overflow-hidden rounded-2xl px-5 py-4 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold shadow-xl transition-all duration-500 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-white/10" />

            <span className="relative flex items-center justify-center gap-2">
              Book Appointment
              <ChevronRight size={16} />
            </span>
          </button>
        </div>
      </div>
    ))}
  </div>
</section>

          {/* ── CONTENT ───────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
                <p className="text-slate-400 font-semibold">Loading your appointments…</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-40">
              <div
                className="text-center px-10 py-10 rounded-[2rem] border border-violet-200"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <CalendarX size={40} className="text-violet-400 mx-auto mb-3" />
                <p className="text-slate-700 font-bold text-xl">{error}</p>
                <p className="text-slate-400 text-sm mt-1">Please try refreshing the page.</p>
              </div>
            </div>
          ) : (
            <>
              <StatsBar appointments={appointments} />

              {/* Upcoming */}
              <section className="mb-20">
                <SectionHeader
                  icon={Clock}
                  label="Upcoming Appointments"
                  count={upcoming.length}
                  gradient="from-violet-500 to-indigo-500"
                />
                {upcoming.length === 0 ? (
                  <EmptyState message="No upcoming appointments" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
                    {upcoming.map((a) => (
                      <AppointmentCard key={a.id} appointment={a} />
                    ))}
                  </div>
                )}
              </section>

              {/* Past */}
              <section>
                <SectionHeader
                  icon={CheckCircle2}
                  label="Past Appointments"
                  count={past.length}
                  gradient="from-emerald-500 to-teal-500"
                />
                {past.length === 0 ? (
                  <EmptyState message="No past appointments" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
                    {past.map((a) => (
                      <AppointmentCard key={a.id} appointment={a} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      {/* BOOKING MODAL */}
{bookingModal && selectedDoctor && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    {/* backdrop */}
    <div
      onClick={() => setBookingModal(false)}
      className="absolute inset-0 bg-black/40 backdrop-blur-md"
    />

    {/* modal */}
    <div
      className="relative w-full max-w-2xl rounded-[2.5rem] border border-white/30 backdrop-blur-3xl shadow-2xl p-8 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.55)",
      }}
    >
      {/* glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-400/20 blur-3xl" />

      {/* close */}
      <button
        onClick={() => setBookingModal(false)}
        className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/60 hover:bg-white transition-all flex items-center justify-center"
      >
        <X size={18} />
      </button>

      {/* header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
          {selectedDoctor.img ? (
            <img
              src={selectedDoctor.img}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center">
              <Stethoscope className="text-violet-500" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-black text-slate-900">
            {selectedDoctor.user?.name}
          </h2>

          <p className="text-violet-600 font-semibold">
            {selectedDoctor.specialization}
          </p>

          <p className="text-slate-400">
            Select an available slot
          </p>
        </div>
      </div>
      {/* appointment type */}
<div className="grid grid-cols-2 gap-4 mb-8">
  <button
    onClick={() =>
      setAppointmentType("HOSPITAL")
    }
    className={`rounded-2xl border p-5 transition-all duration-300 ${
      appointmentType === "HOSPITAL"
        ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-transparent shadow-xl"
        : "bg-white/50 border-white/40 hover:border-violet-300"
    }`}
  >
    <div className="flex items-center gap-3">
      <Building2 size={20} />
      <div className="text-left">
        <p className="font-black">
          In Person
        </p>
        <p className="text-xs opacity-70">
          Hospital visit
        </p>
      </div>
    </div>
  </button>

  <button
    onClick={() =>
      setAppointmentType("ONLINE")
    }
    className={`rounded-2xl border p-5 transition-all duration-300 ${
      appointmentType === "ONLINE"
        ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-transparent shadow-xl"
        : "bg-white/50 border-white/40 hover:border-violet-300"
    }`}
  >
    <div className="flex items-center gap-3">
      <Video size={20} />
      <div className="text-left">
<p className="font-black">
  Chat
</p>
 <p className="text-xs opacity-70">
  Live messaging consultation
</p>
      </div>
    </div>
  </button>
</div>
      


      {/* slots */}
      
     
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
  {selectedDoctor.availableSlots?.map((slot) => {
  const isSelected = selectedSlot?.id === slot.id; // Correct comparison
  const isTaken = slot.taken;

  return (
    <button
      key={slot.id}
      type="button"
      disabled={isTaken}
      onClick={() => setSelectedSlot(slot)} // Updates state
      className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
        isTaken
          ? "bg-slate-100 opacity-50 cursor-not-allowed"
          : isSelected
          ? "bg-violet-600 text-white border-transparent shadow-xl" // Active Color
          : "bg-white/50 border-white/40 hover:border-violet-300"   // Default Color
      }`}
    >
      <p className="font-bold">{formatTime(slot.startTime)}</p>
      <p className="text-xs opacity-70">{formatDate(slot.startTime)}</p>
    </button>
  );
})}
</div>

      {/* action */}
  {/* The Confirm Button */}
<button
  disabled={!selectedSlot || bookingLoading} // Button only works if a slot is picked
  onClick={handleBookAppointment}
  className="w-full rounded-2xl py-4 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  {bookingLoading ? "Processing..." : "Confirm Booking"}
</button>
    </div>
  </div>
)}
    </>
  );
}