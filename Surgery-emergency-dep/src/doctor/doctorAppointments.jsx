import {
CalendarDays,
Clock,
CheckCircle2,
XCircle,
Activity,
ArrowLeft,
Video,
Building2,
User,
Sparkles,
ChevronRight,
Timer,
ShieldCheck,
Loader2,
Ban,
} from "lucide-react";

import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { doctorAPI, patientAPI } from "../auth/api";

gsap.registerPlugin(ScrollTrigger);

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";
const statusConfig = {
SCHEDULED: {
label: "Scheduled",
gradient: "from-violet-500 to-indigo-500",
glow: "#8b5cf6",
border: "border-violet-200",
text: "text-violet-700",
bg: "bg-violet-50",
icon: CalendarDays,
},
ACTIVE: {
label: "Active",
gradient: "from-amber-500 to-orange-500",
glow: "#f59e0b",
border: "border-amber-200",
text: "text-amber-700",
bg: "bg-amber-50",
icon: Activity,
},
COMPLETED: {
label: "Completed",
gradient: "from-emerald-500 to-teal-500",
glow: "#10b981",
border: "border-emerald-200",
text: "text-emerald-700",
bg: "bg-emerald-50",
icon: CheckCircle2,
},
CANCELLED: {
label: "Cancelled",
gradient: "from-slate-400 to-slate-500",
glow: "#94a3b8",
border: "border-slate-200",
text: "text-slate-500",
bg: "bg-slate-50",
icon: XCircle,
},
};

const typeConfig = {
ONLINE: {
label: "Online",
icon: Video,
bg: "bg-cyan-50",
border: "border-cyan-200",
text: "text-cyan-700",
},
HOSPITAL: {
label: "In Person",
icon: Building2,
bg: "bg-fuchsia-50",
border: "border-fuchsia-200",
text: "text-fuchsia-700",
},
};

const formatDate = (date) =>
new Date(date).toLocaleDateString("en-US", {
weekday: "short",
month: "short",
day: "numeric",
year: "numeric",
});

const formatTime = (date) =>
new Date(date).toLocaleTimeString("en-US", {
hour: "2-digit",
minute: "2-digit",
});

function PatientFloat({ patient, glow }) {
const ref = useRef(null);

useEffect(() => {
gsap.to(ref.current, {
y: -10,
duration: 2.5,
repeat: -1,
yoyo: true,
ease: "sine.inOut",
});
}, []);

return (
<div
ref={ref}
className="absolute -top-5 right-6 z-30"
style={{
filter: `drop-shadow(0 10px 24px ${glow}55)`,
}}
>
<div
className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-2xl"
style={{
boxShadow: `0 0 0 4px ${glow}33`,
}}
>
{patient?.img ? (
  <img
    src={patient.img}
    alt={patient?.name}
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center">
    <User className="text-violet-500" />
  </div>
)} </div> </div>
);
}

function AppointmentCard({ appointment, onCancel, cancelling }) {
const sc = statusConfig[appointment.status];
const tc = typeConfig[appointment.type];
const StatusIcon = sc.icon;
const TypeIcon = tc.icon;

const disabled =
appointment.status === "COMPLETED" ||
appointment.status === "CANCELLED";

return ( <div className="appt-card relative group"> <PatientFloat
     patient={appointment.patient}
     glow={sc.glow}
   />

  <div
    className="relative overflow-hidden rounded-[2rem] border border-white/40 backdrop-blur-2xl p-7 shadow-2xl transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02]"
    style={{
      background: "rgba(255,255,255,0.48)",
      boxShadow: `0 10px 50px ${sc.glow}20`,
    }}
  >
    {/* top shimmer */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

    {/* hover glow */}
    <div
      className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br ${sc.gradient}`}
    />

    {/* accent */}
    <div
      className={`absolute top-8 left-0 h-16 w-1 rounded-r-full bg-gradient-to-b ${sc.gradient}`}
    />

    <div className="relative z-10">
      {/* status */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sc.gradient} flex items-center justify-center shadow-xl`}
          >
            <StatusIcon className="text-white" size={24} />
          </div>

          <div>
            <p className="text-xs tracking-[0.25em] uppercase font-bold text-slate-400">
              Appointment
            </p>

            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {appointment.patient?.name}
            </h2>

            <p className="text-sm text-slate-500 font-medium">
              {appointment.patient?.age} yrs •{" "}
              {appointment.patient?.gender}
            </p>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${sc.bg} ${sc.border} ${sc.text}`}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: sc.glow }}
          />
          {sc.label}
        </div>
      </div>

      {/* info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoItem
          icon={CalendarDays}
          label="Date"
          value={formatDate(appointment.scheduledAt)}
        />

        <InfoItem
          icon={Clock}
          label="Time"
          value={formatTime(appointment.scheduledAt)}
        />

        <InfoItem
          icon={Timer}
          label="Duration"
          value={`${appointment.durationMinutes || 30} mins`}
        />

        <InfoItem
          icon={ShieldCheck}
          label="Department"
          value={
            appointment.department?.name || "General Medicine"
          }
        />
      </div>

      {/* notes */}
      {appointment.notes && (
        <div
          className="rounded-2xl border border-white/50 p-4 mb-6"
          style={{
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
            Notes
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            {appointment.notes}
          </p>
        </div>
      )}

      {/* type */}
      <div className="flex items-center gap-3 mb-7 flex-wrap">
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${tc.bg} ${tc.border} ${tc.text}`}
        >
          <TypeIcon size={13} />
          {tc.label}
        </div>

        {appointment.type === "ONLINE" &&
          appointment.status === "ACTIVE" && (
            <Link
              to={`/doctor/chat`}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Join Session
              <ChevronRight size={12} />
            </Link>
          )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-3">
        <Link
          to={`/doctor/patient/${appointment.patient?.user?.id}`}
          className="flex-1 group/profile relative overflow-hidden rounded-2xl border border-white/40 px-5 py-3 backdrop-blur-xl text-sm font-bold text-slate-700 hover:text-violet-700 transition-all duration-500"
          style={{
            background: "rgba(255,255,255,0.5)",
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover/profile:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10" />

          <span className="relative flex items-center justify-center gap-2">
            View Profile
            <ChevronRight
              size={15}
              className="transition-transform duration-300 group-hover/profile:translate-x-1"
            />
          </span>
        </Link>

        <button
          disabled={disabled || cancelling}
          onClick={() => onCancel(appointment.id)}
          className={`relative overflow-hidden rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-500 border ${
            disabled
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              : "border-red-200 text-red-600 hover:text-white"
          }`}
        >
          {!disabled && (
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-red-500 to-rose-500" />
          )}

          <span className="relative flex items-center gap-2">
            {cancelling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling
              </>
            ) : (
              <>
                <Ban size={14} />
                Cancel
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  </div>
</div>

);
}

function InfoItem({ icon: Icon, label, value }) {
return ( <div className="flex items-start gap-3"> <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"> <Icon size={15} className="text-slate-500" /> </div>


  <div>
    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold">
      {label}
    </p>

    <p className="text-sm font-semibold text-slate-700 leading-tight">
      {value}
    </p>
  </div>
</div>


);
}

function SectionTitle({ title, count }) {
return ( <div className="flex items-center gap-4 mb-10"> <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl"> <Sparkles className="text-white" size={18} /> </div>

  <div>
    <h2 className="text-3xl font-black text-slate-900">
      {title}
    </h2>

    <p className="text-sm text-slate-400 font-semibold">
      {count} appointments
    </p>
  </div>

  <div className="h-px flex-1 bg-gradient-to-r from-slate-300/70 to-transparent" />
</div>


);
}

export default function DoctorAppointments() {
const wrapperRef = useRef(null);
const heroRef = useRef(null);
const progressRef = useRef(null);

const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(true);
const [cancellingId, setCancellingId] = useState(null);

useEffect(() => {
  const load = async () => {
    try {
      const { data } =
        await doctorAPI.getMyAppointments();
        
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);

const handleCancel = async (id) => {
const old = appointments;


setCancellingId(id);

setAppointments((prev) =>
  prev.map((a) =>
    a.id === id
      ? { ...a, status: "CANCELLED" }
      : a
  )
);

try {
  await doctorAPI.cancelAppointment(
    id,
    "CANCELLED"
  );
} catch {
  setAppointments(old);
} finally {
  setCancellingId(null);
}


};

useEffect(() => {
if (loading) return;


const ctx = gsap.context(() => {
  gsap.timeline({
    defaults: {
      ease: "power4.out",
    },
  })
    .fromTo(
      ".hero-badge",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 }
    )
    .fromTo(
      ".hero-title",
      {
        opacity: 0,
        y: 60,
        scale: 0.94,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
      },
      "-=0.4"
    )
    .fromTo(
      ".hero-body",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9 },
      "-=0.7"
    );

  gsap.fromTo(
    ".stat-pill",
    {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.08,
      duration: 0.5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".stat-pill",
        start: "top 90%",
      },
    }
  );

  gsap.fromTo(
    ".appt-card",
    {
      opacity: 0,
      y: 60,
      scale: 0.92,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      stagger: 0.08,
      duration: 0.7,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ".appt-card",
        start: "top 85%",
      },
    }
  );

  gsap.to(heroRef.current, {
    y: -90,
    opacity: 0.4,
    scale: 0.96,
    ease: "none",
    scrollTrigger: {
      trigger: heroRef.current,
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });

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

  gsap.to(".glow-left", {
    y: 120,
    x: 60,
    ease: "none",
    scrollTrigger: {
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom top",
      scrub: 2,
    },
  });

  gsap.to(".glow-right", {
    y: -120,
    x: -60,
    ease: "none",
    scrollTrigger: {
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom top",
      scrub: 2,
    },
  });
}, wrapperRef);

return () => ctx.revert();


}, [loading]);

const upcoming = useMemo(
() =>
appointments.filter(
(a) =>
a.status === "SCHEDULED" ||
a.status === "ACTIVE"
),
[appointments]
);

const previous = useMemo(
() =>
appointments.filter(
(a) =>
a.status === "COMPLETED" ||
a.status === "CANCELLED"
),
[appointments]
);

const stats = [
{
label: "Total",
value: appointments.length,
gradient: "from-violet-500 to-fuchsia-500",
},
{
label: "Upcoming",
value: upcoming.length,
gradient: "from-indigo-500 to-violet-500",
},
{
label: "Completed",
value: appointments.filter(
(a) => a.status === "COMPLETED"
).length,
gradient: "from-emerald-500 to-teal-500",
},
{
label: "Cancelled",
value: appointments.filter(
(a) => a.status === "CANCELLED"
).length,
gradient: "from-slate-500 to-slate-400",
},
];

return (
<>
<div
ref={progressRef}
style={{
position: "fixed",
top: 0,
left: 0,
width: "100%",
height: "3px",
transformOrigin: "left center",
transform: "scaleX(0)",
background:
"linear-gradient(90deg,#8b5cf6,#6366f1,#d946ef)",
zIndex: 9999,
}}
/>


  <div
    ref={wrapperRef}
    className="min-h-screen relative overflow-x-hidden"
    style={{
      backgroundImage:
        NOISE +
        ", linear-gradient(135deg,#f5f3ff 0%,#ede9fe 40%,#faf5ff 100%)",
    }}
  >
    {/* ambient glows */}
    <div className="glow-left fixed top-[-10rem] left-[-10rem] w-[42rem] h-[42rem] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none" />

    <div className="glow-right fixed bottom-[-10rem] right-[-10rem] w-[42rem] h-[42rem] rounded-full bg-fuchsia-400/20 blur-[120px] pointer-events-none" />

    <div className="relative z-10 px-4 md:px-8 xl:px-16 pb-40">
      {/* hero */}
      <section
        ref={heroRef}
        className="min-h-[72vh] flex items-center pt-16"
      >
        <div className="w-full max-w-5xl">
          <Link
            to="/doctor"
            className="hero-badge inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-7 group"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Back to Dashboard
          </Link>

          <div
            className="relative overflow-hidden rounded-[2.8rem] border border-white/40 backdrop-blur-2xl shadow-2xl p-10 md:p-14"
            style={{
              background: "rgba(255,255,255,0.48)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-400/10 blur-3xl" />

            <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 text-violet-700 border border-violet-300/40 text-sm font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              Doctor Appointments
            </span>

            <h1 className="hero-title text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-slate-900 mb-6">
              Manage Your{" "}
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                Patient
              </span>{" "}
              Schedule
            </h1>

            <p className="hero-body text-slate-600 text-xl md:text-2xl max-w-3xl leading-relaxed">
              Seamlessly oversee consultations,
              patient history, upcoming sessions,
              and clinical workflow inside a
              cinematic medical operating system.
            </p>
          </div>
        </div>
      </section>

      {/* loading */}
      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-[5px] border-violet-200 border-t-violet-500 animate-spin" />

            <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-2xl animate-pulse" />

            <p className="mt-8 text-slate-500 font-semibold">
              Loading appointments...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* stats */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
            {stats.map((s) => (
              <div
                key={s.label}
                className="stat-pill relative overflow-hidden rounded-[2rem] border border-white/40 backdrop-blur-2xl p-6 shadow-xl hover:-translate-y-1 transition-all duration-500"
                style={{
                  background:
                    "rgba(255,255,255,0.46)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                <div
                  className={`absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${s.gradient}`}
                />

                <p className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">
                  {s.label}
                </p>

                <h2
                  className={`text-5xl font-black bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}
                >
                  {s.value}
                </h2>
              </div>
            ))}
          </section>

          {/* upcoming */}
          <section className="mb-24">
            <SectionTitle
              title="Upcoming Appointments"
              count={upcoming.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {upcoming.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  cancelling={
                    cancellingId === appointment.id
                  }
                />
              ))}
            </div>
          </section>

          {/* previous */}
          <section>
            <SectionTitle
              title="Previous Appointments"
              count={previous.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {previous.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  cancelling={
                    cancellingId === appointment.id
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  </div>
</>

);
}
