import { useState, useEffect, useRef } from "react";
import {
  HeartPulse, Mail, Lock, ShieldCheck,
  Info, Users, Building2, ChevronRight,
  Activity, Stethoscope, Clock, AlertCircle,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";

const API = "http://localhost:8000";

const ROLE_ROUTES = {
  DOCTOR:  "/doctor/dashboard",
  NURSE:   "/nurse/dashboard",
  ADMIN:   "/admin/dashboard",
  PATIENT: "/patient/dashboard",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/8 border border-white/12 backdrop-blur-md rounded-2xl px-4 py-3"
      style={{ animation: "floatUp 0.6s ease both", animationDelay: delay }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + "25", border: `1px solid ${color}40` }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <div className="text-white font-bold text-sm leading-none">{value}</div>
        <div className="text-white/45 text-xs mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// Maps priority → color
const PRIORITY_COLOR = {
  CRITICAL: "#ef4444",
  HIGH:     "#f97316",
  MEDIUM:   "#f59e0b",
  LOW:      "#22c55e",
};

// Maps surgery status → color
const SURGERY_COLOR = {
  IN_PROGRESS: "#3b82f6",
  PENDING:     "#a855f7",
  COMPLETED:   "#22c55e",
  CANCELLED:   "#94a3b8",
};

function ActivityItem({ color, pulse, text, bold, time, animDelay }) {
  return (
    <div
      className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-3 py-2.5"
      style={{ animation: "slideIn 0.4s ease both", animationDelay: animDelay }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: color,
          animation: pulse ? "livePulse 2s ease-in-out infinite" : "none",
          boxShadow: pulse ? `0 0 0 3px ${color}30` : "none",
        }}
      />
      <span className="text-xs text-slate-500 flex-1 leading-tight">
        {text} <strong className="text-slate-800 font-semibold">{bold}</strong>
      </span>
      <span className="text-xs text-slate-300 flex-shrink-0">{time}</span>
    </div>
  );
}

function QuickCard({ label, bg, iconColor, Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-xl py-3 px-2 hover:border-slate-300 hover:shadow-sm transition-all duration-200 active:scale-95"
    >
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </button>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function SignIn() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [hovered, setHovered]   = useState(false);

  // live data state
  const [liveData, setLiveData]       = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);

  const emailRef  = useRef(null);
  const canvasRef = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => { emailRef.current?.focus(); }, []);

  // ── fetch live data ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await axios.get(`${API}/fetchdata`);
        if (mounted) setLiveData(data);
      } catch {
        // silently fail — fall back to skeleton UI
      } finally {
        if (mounted) setLiveLoading(false);
      }
    }

    load();
    // refresh every 30 s so the page stays live
    const interval = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // ── derive display data from API response ────────────────────────────────
  const derived = (() => {
    if (!liveData) return null;

    const { emergency = [], surgeryies = [], availableDoctors = [] } = liveData;

    // stat bar numbers
    const activeEmergency    = emergency.filter(e => ["WAITING", "IN_TREATMENT"].includes(e.status)).length;
    const activeSurgeries    = surgeryies.filter(s => s.surgeryStatus === "IN_PROGRESS").length;
    const pendingSurgeries   = surgeryies.filter(s => s.surgeryStatus === "PENDING").length;
    const availableDoctorCnt = availableDoctors.filter(d => d.availability.length > 0).length;

    // build activity items from most recent events
    const activityItems = [];

    // critical / high priority ER cases
    const criticalER = emergency
      .filter(e => ["CRITICAL", "HIGH"].includes(e.priority) && e.status !== "DISCHARGED")
      .sort((a, b) => new Date(b.arrivalTime) - new Date(a.arrivalTime))
      .slice(0, 2);

    criticalER.forEach((e, i) => {
      activityItems.push({
        color:      PRIORITY_COLOR[e.priority] ?? "#f59e0b",
        pulse:      e.status === "WAITING" || e.status === "IN_TREATMENT",
        text:       `ER — ${e.priority.toLowerCase()} priority,`,
        bold:       e.status.replace("_", " ").toLowerCase(),
        time:       timeAgo(e.arrivalTime),
        animDelay:  `${0.35 + i * 0.07}s`,
      });
    });

    // in-progress surgeries
    const inProgressSurg = surgeryies
      .filter(s => s.surgeryStatus === "IN_PROGRESS")
      .sort((a, b) => new Date(b.startedAt ?? b.createdAt) - new Date(a.startedAt ?? a.createdAt))
      .slice(0, 2);

    inProgressSurg.forEach((s, i) => {
      activityItems.push({
        color:     SURGERY_COLOR.IN_PROGRESS,
        pulse:     false,
        text:      `Surgery —`,
        bold:      `OR in progress (${s.type.toLowerCase()})`,
        time:      timeAgo(s.startedAt ?? s.createdAt),
        animDelay: `${0.35 + (criticalER.length + i) * 0.07}s`,
      });
    });

    // pending surgeries
    const pendingSurg = surgeryies
      .filter(s => s.surgeryStatus === "PENDING")
      .sort((a, b) => new Date(a.scheduledAt ?? a.createdAt) - new Date(b.scheduledAt ?? b.createdAt))
      .slice(0, 1);

    pendingSurg.forEach((s, i) => {
      activityItems.push({
        color:     SURGERY_COLOR.PENDING,
        pulse:     false,
        text:      `Surgery —`,
        bold:      `pending prep (${s.type.toLowerCase()})`,
        time:      timeAgo(s.createdAt),
        animDelay: `${0.35 + (criticalER.length + inProgressSurg.length + i) * 0.07}s`,
      });
    });

    // fallback if nothing interesting
    if (activityItems.length === 0) {
      activityItems.push({
        color: "#22c55e", pulse: true,
        text: "All systems —", bold: "no active alerts",
        time: "now", animDelay: "0.35s",
      });
    }

    return { activeEmergency, activeSurgeries, pendingSurgeries, availableDoctorCnt, activityItems };
  })();

  // ── particle canvas ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 28 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o:  Math.random() * 0.4 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.o})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147,197,253,${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/login`, { email, password });
      localStorage.setItem("access_token",  data.access_Token);
      localStorage.setItem("refresh_token", data.refresh_Token);
      localStorage.setItem("token_expiry",  data.expiresin);
      localStorage.setItem("role",          data.role);
      if (data.id) localStorage.setItem("profile_id", data.id);
      navigate(ROLE_ROUTES[data.role] ?? "/dashboard");
    } catch (err) {
      const msg = err.response?.data;
      setError(
        typeof msg === "string" ? msg :
        msg?.error ?? msg?.err ?? "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.08); opacity: 0.15; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0.1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
        .right-panel::-webkit-scrollbar { display: none; }
        .right-panel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col md:flex-row min-h-screen w-full">

        {/* ════════ LEFT PANEL ════════ */}
        <div
          className="relative flex flex-col p-6 md:p-10 w-full md:w-1/2 md:min-h-screen"
          style={{
            minHeight: "240px",
            backgroundImage: "url(https://t3.ftcdn.net/jpg/06/02/66/76/360_F_602667660_gMzX74MC34kXy7pTlt3OoCreddAbNQOR.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/65 via-blue-950/72 to-slate-900/88" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(147,197,253,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(147,197,253,0.15) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.7 }} />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <HeartPulse className="text-white" size={22} />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">MediCore</span>
          </div>

          {/* Stat cards — desktop only, now with real data */}
          <div
            className="absolute top-24 right-8 z-10 flex-col gap-2.5 hidden md:flex"
            style={{ animation: "floatUp 0.5s ease both" }}
          >
            <StatCard
              icon={Activity}
              label="Active ER Cases"
              value={derived ? String(derived.activeEmergency) : "—"}
              color="#60a5fa"
              delay="0.1s"
            />
            <StatCard
              icon={Stethoscope}
              label="Surgeries Live"
              value={derived ? `${derived.activeSurgeries} Active` : "—"}
              color="#34d399"
              delay="0.2s"
            />
            <StatCard
              icon={Clock}
              label="Pending Surgeries"
              value={derived ? String(derived.pendingSurgeries) : "—"}
              color="#f59e0b"
              delay="0.3s"
            />
          </div>

          {/* About Us button — desktop only */}
          <div className="absolute inset-0 items-center justify-center z-10 pointer-events-none hidden md:flex">
            <button
              onClick={() => navigate("/about")}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="pointer-events-auto flex flex-col items-center gap-4 cursor-pointer"
              style={{ background: "none", border: "none" }}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="absolute rounded-full border border-white/20"
                  style={{
                    width: hovered ? 170 : 140, height: hovered ? 170 : 140,
                    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    animation: "ping-slow 3s ease-in-out infinite",
                  }}
                />
                <span
                  className="absolute rounded-full border border-white/10"
                  style={{
                    width: hovered ? 210 : 180, height: hovered ? 210 : 180,
                    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    animation: "ping-slow 3s ease-in-out infinite 0.6s",
                  }}
                />
                <div
                  className="relative flex items-center justify-center rounded-full bg-white/10 border border-white/25 backdrop-blur-md"
                  style={{
                    width: hovered ? 130 : 110, height: hovered ? 130 : 110,
                    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    boxShadow: hovered
                      ? "0 0 60px rgba(147,197,253,0.35), 0 20px 40px rgba(0,0,0,0.3)"
                      : "0 8px 32px rgba(0,0,0,0.25)",
                  }}
                >
                  <div className="absolute inset-0 rounded-full" style={{ animation: "spin-slow 8s linear infinite" }}>
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-300 rounded-full opacity-70" />
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-40" />
                  </div>
                  <Info size={hovered ? 46 : 38} className="text-white drop-shadow-lg"
                    style={{ transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
                </div>
              </div>
              <div
                className="flex flex-col items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-5 py-3"
                style={{
                  transform: hovered ? "translateY(-4px)" : "translateY(0)",
                  transition: "all 0.35s ease",
                  boxShadow: hovered ? "0 12px 30px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <span className="text-white font-semibold text-sm tracking-wide">About MediCore</span>
                <div className="flex items-center gap-4 text-white/60 text-xs">
                  <span className="flex items-center gap-1"><Users size={11} /> 500+ Staff</span>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="flex items-center gap-1"><Building2 size={11} /> 2 Departments</span>
                </div>
                <span
                  className="flex items-center gap-1 text-blue-300 text-xs font-semibold"
                  style={{
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? "translateY(0)" : "translateY(4px)",
                    transition: "all 0.25s ease 0.05s",
                  }}
                >
                  Learn more <ChevronRight size={12} />
                </span>
              </div>
            </button>
          </div>

          {/* Doctor quote */}
          <div
            className="absolute left-8 z-10 hidden md:block"
            style={{ top: "50%", transform: "translateY(-50%)", maxWidth: "140px", animation: "floatUp 0.7s ease 0.4s both" }}
          >
            <div className="bg-white/8 border border-white/12 backdrop-blur-md rounded-2xl p-3.5">
              <div className="text-white/25 text-3xl leading-none mb-1">"</div>
              <p className="text-white/70 text-xs leading-relaxed italic">
                MediCore transformed how our teams coordinate during critical moments.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 rounded-full bg-blue-400/30 border border-blue-300/30 flex items-center justify-center">
                  <Stethoscope size={11} className="text-blue-200" />
                </div>
                <div>
                  <div className="text-white/80 text-xs font-semibold">Dr. Sarah K.</div>
                  <div className="text-white/35 text-xs">Head of Surgery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom copy */}
          <div className="relative z-10 mt-auto pt-6 md:pt-0 md:absolute md:bottom-10 md:left-0 md:right-0 flex flex-col items-center text-center md:px-10">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-2 md:mb-3">
              Unified care,<br />one platform.
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto hidden md:block">
              Powering Surgery &amp; Emergency departments with real-time tools built for medical teams.
            </p>
            <div className="flex gap-2 mt-3 md:mt-5 flex-wrap justify-center">
              <span className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Surgery Unit
              </span>
              <span className="flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block animate-pulse" /> Emergency Dept
              </span>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT PANEL ════════ */}
        <div className="right-panel flex flex-1 items-start md:items-center justify-center bg-slate-50 px-5 sm:px-8 py-8 md:py-10 overflow-y-auto md:h-screen">
          <div className="w-full max-w-sm">

            {/* ── LIVE ACTIVITY FEED ── */}
            <div className="mb-6" style={{ animation: "floatUp 0.45s ease both" }}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Live system status
                </p>
                {/* subtle live indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-slate-300">live</span>
                </div>
              </div>

              {/* skeleton while loading */}
              {liveLoading ? (
                <div className="flex flex-col gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : derived ? (
                <div className="flex flex-col gap-1.5">
                  {derived.activityItems.map((item, i) => (
                    <ActivityItem key={i} {...item} />
                  ))}
                </div>
              ) : (
                /* API failed — show a quiet fallback */
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                  Could not reach server right now
                </div>
              )}
            </div>

            {/* ── STAT PILLS (real numbers) ── */}
            {!liveLoading && derived && (
              <div
                className="grid grid-cols-3 gap-2 mb-6"
                style={{ animation: "floatUp 0.45s ease 0.08s both" }}
              >
                {[
                  { label: "ER active",  value: derived.activeEmergency,    color: "text-blue-600",  bg: "bg-blue-50"  },
                  { label: "In surgery", value: derived.activeSurgeries,    color: "text-green-600", bg: "bg-green-50" },
                  { label: "Doctors on", value: derived.availableDoctorCnt, color: "text-violet-600",bg: "bg-violet-50"},
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5`}>
                    <span className={`text-lg font-bold leading-none ${color}`}>{value}</span>
                    <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            )}
            {liveLoading && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full" />)}
              </div>
            )}

            {/* ── FORM HEADER ── */}
            <div className="mb-6" style={{ animation: "floatUp 0.45s ease 0.05s both" }}>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                Welcome back 👋
              </h1>
              <p className="text-sm text-slate-400">
                Sign in to access your department dashboard
              </p>
            </div>

            {/* ── ERROR BANNER ── */}
            {error && (
              <div
                className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-3.5 py-3 mb-4"
                style={{ animation: "slideIn 0.25s ease both" }}
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              style={{ animation: "floatUp 0.45s ease 0.1s both" }}
            >
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    id="email" type="email" ref={emailRef} value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="doctor@medicore.com" required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    id="password" type="password" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password" required
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm shadow-blue-900/20 mt-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Signing in...
                  </>
                ) : "Sign In →"}
              </button>
            </form>

            {/* ── QUICK ACCESS ── */}
            <div className="mt-6" style={{ animation: "floatUp 0.45s ease 0.2s both" }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Quick access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <QuickCard
                  label="Emergency" bg="bg-blue-50" iconColor="#3b82f6"
                  Icon={Activity} onClick={() => navigate("/emergency")}
                />
                <QuickCard
                  label="Surgery" bg="bg-green-50" iconColor="#22c55e"
                  Icon={Stethoscope} onClick={() => navigate("/surgery")}
                />
              </div>
            </div>

            {/* ── SYSTEM HEALTH BAR ── */}
            <div
              className="flex items-center justify-between mt-3 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5"
              style={{ animation: "floatUp 0.45s ease 0.28s both" }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-slate-500 font-medium">All systems operational</span>
              </div>
              <div className="flex gap-0.5 items-end">
                {[14, 14, 14, 14, 6].map((h, i) => (
                  <div
                    key={i} className="w-1 rounded-sm"
                    style={{ height: `${h}px`, background: i < 4 ? "#22c55e" : "#e2e8f0" }}
                  />
                ))}
              </div>
            </div>

            {/* ── SECURITY + SIGNUP ── */}
            <div
              className="mt-4 space-y-2 pb-8 md:pb-0"
              style={{ animation: "floatUp 0.45s ease 0.32s both" }}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={13} className="text-green-500" />
                Secure &amp; encrypted connection
              </div>
              <p className="text-center text-xs text-slate-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Sign Up</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}