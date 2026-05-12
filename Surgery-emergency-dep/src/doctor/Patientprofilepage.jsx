import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { patientAPI } from "../auth/api";
import {
  ArrowLeft,
  User,
  Heart,
  Mail,
  AlertTriangle,
  FileText,
  Activity,
  Droplets,
  Calendar,
  Clock,
  ChevronRight,
  Stethoscope,
  Pill,
  Download,
  ShieldAlert,
  Loader2,
  BadgeCheck,
  ScanLine,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const bloodTypeColor = {
  "A+": "from-rose-500 to-red-400",
  "A-": "from-rose-600 to-red-500",
  "B+": "from-orange-500 to-amber-400",
  "B-": "from-orange-600 to-amber-500",
  "AB+": "from-fuchsia-500 to-pink-400",
  "AB-": "from-fuchsia-600 to-pink-500",
  "O+": "from-emerald-500 to-teal-400",
  "O-": "from-emerald-600 to-teal-500",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/50 backdrop-blur-xl shadow-xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.52)",
        boxShadow: "0 8px 40px rgba(15,23,42,0.08)",
        ...style,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      {children}
    </div>
  );
}

function StatBadge({ label, value, icon: Icon, gradient }) {
  return (
    <div className="stat-item flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-white/60 border border-white/70 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}
      >
        <Icon size={17} className="text-white" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-slate-400">
        {label}
      </p>
      <p className="text-lg font-black text-slate-800 leading-none">{value || "—"}</p>
    </div>
  );
}

function RecordCard({ record, index }) {
  return (
    <div
      className="record-item group relative flex items-start gap-4 p-5 rounded-2xl bg-white/60 border border-white/70 hover:bg-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shrink-0">
        <FileText size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">{record.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{fmt(record.createdAt)}</p>
        {record.fileUrl?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {record.fileUrl.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition-colors"
              >
                <Download size={10} />
                File {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs font-bold text-slate-300 tabular-nums mt-0.5">
        #{String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function AllergyTag({ allergy }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
      <AlertTriangle size={11} />
      {allergy}
    </span>
  );
}

function SectionHeading({ icon: Icon, title, accent }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
      >
        <Icon size={15} className="text-white" />
      </div>
      <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonPulse({ className }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pt-6">
      <SkeletonPulse className="h-64 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonPulse key={i} className="h-28" />
        ))}
      </div>
      <SkeletonPulse className="h-48 w-full" />
      <SkeletonPulse className="h-64 w-full" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PatientProfilePage() {
  const { id } = useParams();
  const wrapperRef = useRef(null);
  const progressRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch patient data
  useEffect(() => {
    if (!id) return;
    
    const load = async () => {
      try {
        const { data } = await patientAPI.getProfileById(id);
        setProfile(data);
      } catch (err) {
        setError(err?.response?.data?.err || "Failed to load patient profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // GSAP animations after data loads
  useEffect(() => {
    if (loading || !profile) return;

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-avatar", { scale: 0.6, opacity: 0, rotateZ: -8 }, { scale: 1, opacity: 1, rotateZ: 0, duration: 0.9 })
        .fromTo(".hero-name", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8 }, "-=0.5")
        .fromTo(".hero-meta span", { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.5 }, "-=0.4")
        .fromTo(".hero-badge", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, stagger: 0.08, duration: 0.4 }, "-=0.3");

      // Stat items
      gsap.fromTo(
        ".stat-item",
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1,
          stagger: 0.07, duration: 0.5, ease: "power3.out",
          scrollTrigger: { trigger: ".stats-section", start: "top 85%" },
        }
      );

      // Sections fade up
      gsap.fromTo(
        ".section-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          stagger: 0.1, duration: 0.65, ease: "power3.out",
          scrollTrigger: { trigger: ".section-card", start: "top 88%" },
        }
      );

      // Records
      gsap.fromTo(
        ".record-item",
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0,
          stagger: 0.06, duration: 0.45, ease: "power3.out",
          scrollTrigger: { trigger: ".records-section", start: "top 85%" },
        }
      );

      // Scroll progress bar
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0,
        },
      });

      // Parallax ambient glows
      gsap.to(".glow-a", {
        y: 100, x: 50, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 },
      });
      gsap.to(".glow-b", {
        y: -100, x: -50, ease: "none",
        scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom top", scrub: 2 },
      });

      // Floating avatar
      gsap.to(".hero-avatar", {
        y: -8, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading, profile]);

  const allergies = profile?.patient?.allergies
    ? profile.patient.allergies.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  const bloodGradient =
    bloodTypeColor[profile?.patient?.bloodtype] || "from-slate-400 to-slate-500";

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={progressRef}
        className="fixed top-0 left-0 w-full h-[3px] z-[9999]"
        style={{
          transformOrigin: "left center",
          transform: "scaleX(0)",
          background: "linear-gradient(90deg, #06b6d4, #6366f1, #a855f7)",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{
          backgroundImage:
            NOISE +
            ", linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 30%, #f5f3ff 65%, #fdf4ff 100%)",
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        {/* Ambient glows */}
        <div className="glow-a fixed -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-cyan-400/15 blur-[120px] pointer-events-none" />
        <div className="glow-b fixed -bottom-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-violet-400/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pb-32 pt-8">
          {/* Back nav */}
          <Link
            to="/doctor/appointments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Back to Appointments
          </Link>

          {/* ── Loading ── */}
          {loading && <LoadingSkeleton />}

          {/* ── Error ── */}
          {!loading && error && (
            <GlassCard className="p-12 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-xl">
                <ShieldAlert size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Could not load profile</h2>
              <p className="text-slate-500 max-w-sm">{error}</p>
              <Link
                to="/doctor/appointments"
                className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-bold shadow-lg hover:shadow-slate-500/30 transition-all"
              >
                Go back
              </Link>
            </GlassCard>
          )}

          {/* ── Content ── */}
          {!loading && !error && profile && (
            <div className="space-y-8">

              {/* ── Hero card ── */}
              <GlassCard className="p-8 md:p-12">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.12) 0%, transparent 60%)",
                  }}
                />
                {/* Decorative scan lines */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 6px)",
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                  {/* Avatar */}
                  <div className="hero-avatar shrink-0 relative">
                    <div
                      className="w-28 h-28 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-2xl"
                      style={{ boxShadow: "0 0 0 6px rgba(99,102,241,0.15), 0 20px 50px rgba(99,102,241,0.2)" }}
                    >
                      {profile.patient?.img ? (
                        <img
                          src={profile.patient.img}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-indigo-100 flex items-center justify-center">
                          <User size={40} className="text-indigo-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg border-2 border-white">
                      <BadgeCheck size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-300/40 text-cyan-700 text-xs font-bold">
                        <ScanLine size={10} />
                        Patient Record
                      </span>
                      <span className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-300/40 text-indigo-700 text-xs font-bold">
                        ID: {id?.slice(0, 8)}…
                      </span>
                    </div>

                    <h1 className="hero-name text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                      {profile.name}
                    </h1>

                    <div className="hero-meta flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Activity size={13} className="text-indigo-400" />
                        {profile.age} years old
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-cyan-400" />
                        {profile.email}
                      </span>
                      {profile.patient?.bloodtype && (
                        <span className="flex items-center gap-1.5">
                          <Droplets size={13} className="text-rose-400" />
                          Blood type {profile.patient.bloodtype}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Blood type badge */}
                  {profile.patient?.bloodtype && (
                    <div
                      className={`hero-badge shrink-0 w-20 h-20 rounded-[1.25rem] bg-gradient-to-br ${bloodGradient} flex flex-col items-center justify-center shadow-2xl border-2 border-white/40`}
                    >
                      <Droplets size={18} className="text-white/80 mb-0.5" />
                      <span className="text-2xl font-black text-white">
                        {profile.patient.bloodtype}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* ── Stats row ── */}
              <div className="stats-section grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge
                  label="Age"
                  value={`${profile.age} yrs`}
                  icon={Calendar}
                  gradient="from-violet-500 to-fuchsia-500"
                />
                <StatBadge
                  label="Records"
                  value={profile.patient?.records?.length ?? 0}
                  icon={FileText}
                  gradient="from-indigo-500 to-blue-500"
                />
                <StatBadge
                  label="Visits"
                  value={profile.patient?.visits?.length ?? 0}
                  icon={Stethoscope}
                  gradient="from-cyan-500 to-teal-500"
                />
                <StatBadge
                  label="Allergies"
                  value={allergies.length || "None"}
                  icon={AlertTriangle}
                  gradient={allergies.length ? "from-amber-500 to-orange-400" : "from-slate-400 to-slate-500"}
                />
              </div>

              {/* ── Two-col layout ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Allergies */}
                <GlassCard className="section-card p-7">
                  <SectionHeading
                    icon={AlertTriangle}
                    title="Allergies"
                    accent="from-amber-500 to-orange-400"
                  />
                  {allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergies.map((a) => (
                        <AllergyTag key={a} allergy={a} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No known allergies recorded.</p>
                  )}
                </GlassCard>

                {/* Quick info */}
                <GlassCard className="section-card p-7">
                  <SectionHeading
                    icon={Heart}
                    title="Clinical Overview"
                    accent="from-rose-500 to-pink-400"
                  />
                  <div className="space-y-3">
                    <InfoRow label="Blood Type" value={profile.patient?.bloodtype || "Not recorded"} icon={Droplets} />
                    <InfoRow label="Email" value={profile.email} icon={Mail} />
                    <InfoRow label="Age" value={`${profile.age} years`} icon={Calendar} />
                    <InfoRow
                      label="Patient Since"
                      value={profile.patient?.createdAt ? fmt(profile.patient.createdAt) : "—"}
                      icon={Clock}
                    />
                  </div>
                </GlassCard>
              </div>

              {/* ── Medical Records ── */}
              <GlassCard className="section-card records-section p-7 md:p-9">
                <SectionHeading
                  icon={FileText}
                  title="Medical Records"
                  accent="from-indigo-500 to-violet-500"
                />
                {profile.patient?.records?.length > 0 ? (
                  <div className="space-y-3">
                    {profile.patient.records.map((record, i) => (
                      <RecordCard key={record.id} record={record} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <FileText size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-semibold">No medical records on file.</p>
                  </div>
                )}
              </GlassCard>

              {/* ── Appointments summary ── */}
              {profile.patient?.appointments?.length > 0 && (
                <GlassCard className="section-card p-7 md:p-9">
                  <SectionHeading
                    icon={Stethoscope}
                    title="Appointment History"
                    accent="from-teal-500 to-cyan-400"
                  />
                  <div className="space-y-3">
                    {profile.patient.appointments.slice(0, 5).map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/60 border border-white/70 hover:bg-white/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow">
                            <Calendar size={14} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {appt.type === "ONLINE" ? "Online" : "In-Person"} Consultation
                            </p>
                            <p className="text-xs text-slate-400">{fmt(appt.scheduledAt)}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                            appt.status === "COMPLETED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : appt.status === "SCHEDULED"
                              ? "bg-violet-50 border-violet-200 text-violet-700"
                              : appt.status === "ACTIVE"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    ))}
                    {profile.patient.appointments.length > 5 && (
                      <p className="text-center text-xs text-slate-400 pt-2 font-semibold">
                        +{profile.patient.appointments.length - 5} more appointments
                      </p>
                    )}
                  </div>
                </GlassCard>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100/80 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-slate-400" />
      </div>
      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs uppercase tracking-[0.18em] font-bold text-slate-400">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-700 truncate text-right">
          {value}
        </span>
      </div>
    </div>
  );
}