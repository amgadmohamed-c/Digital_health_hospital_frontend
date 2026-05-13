import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Scissors,
  CalendarPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  BedDouble,
  User,
  FileText,
  X,
  AlertCircle,
  Activity,
  CalendarDays,
  Search,
  ChevronLeft,
  LayoutGrid,
  Zap,
  Wrench,
  WifiOff,
  Cpu,
} from "lucide-react";
import { surgeryAPI, doctorAPI } from "../auth/api";

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────────────────────────
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const STATUS = {
  PENDING:     { label: "Pending",     bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   icon: Clock },
  IN_PROGRESS: { label: "In Progress", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    icon: Activity },
  COMPLETED:   { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500",     icon: XCircle },
};

const DEVICE_STATUS = {
  AVAILABLE:      { dot: "bg-emerald-400", label: "Ready",       icon: Zap },
  IN_USE:         { dot: "bg-blue-400",    label: "In Use",      icon: Activity },
  MAINTENANCE:    { dot: "bg-amber-400",   label: "Maintenance", icon: Wrench },
  OUT_OF_SERVICE: { dot: "bg-red-400",     label: "Out of Svc",  icon: WifiOff },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(date, opts) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", opts);
}
function fmtTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function getInitials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function getSurgeryStatus(surgery) {
  return surgery?.surgeryStatus ?? surgery?.status ?? "PENDING";
}
function getSurgeryType(surgery) {
  return surgery?.type ?? surgery?.surgeryType ?? "SCHEDULED";
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ surgery }) {
  const statusKey = getSurgeryStatus(surgery);
  const s = STATUS[statusKey] ?? STATUS.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── SurgeryCard ──────────────────────────────────────────────────────────────
function SurgeryCard({ surgery, onCancel, onNotes, isPast, showDoctor }) {
  const patientName =
    surgery.patient?.user?.name ?? surgery.patient?.name ?? "Unknown Patient";
  const doctorName =
    surgery.surgeon?.user?.name ?? surgery.surgeon?.name ?? null;
  const roomLabel = surgery.room?.name ?? surgery.room?.roomNumber ?? "—";
  const statusKey = getSurgeryStatus(surgery);

  const accentGradient = {
    IN_PROGRESS: "linear-gradient(90deg,#3b82f6,#06b6d4)",
    COMPLETED:   "linear-gradient(90deg,#10b981,#059669)",
    CANCELLED:   "linear-gradient(90deg,#ef4444,#f97316)",
    PENDING:     "linear-gradient(90deg,#8b5cf6,#d946ef)",
  }[statusKey] ?? "linear-gradient(90deg,#8b5cf6,#d946ef)";

  return (
    <div
      className="surgery-card relative rounded-2xl border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.52)", backdropFilter: "blur(18px)" }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: accentGradient }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-xs font-bold">{getInitials(patientName)}</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{patientName}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{getSurgeryType(surgery)}</p>
            </div>
          </div>
          <StatusBadge surgery={surgery} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CalendarDays size={11} className="text-violet-400 flex-shrink-0" />
            <span>{fmt(surgery.scheduledAt, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Clock size={11} className="text-violet-400 flex-shrink-0" />
            <span>
              {fmtTime(surgery.scheduledAt)}
              {surgery.estimatedDuration ? ` · ${surgery.estimatedDuration}min` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <BedDouble size={11} className="text-violet-400 flex-shrink-0" />
            <span>Room {roomLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <User size={11} className="text-violet-400 flex-shrink-0" />
            <span className="truncate">{patientName}</span>
          </div>
        </div>

        {showDoctor && doctorName && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 text-[11px] text-slate-600"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.14)" }}
          >
            <Scissors size={11} className="text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-indigo-600 mr-1">Surgeon:</span>
            <span>{doctorName}</span>
            {surgery.surgeon?.specialization && (
              <span className="ml-auto text-slate-400">· {surgery.surgeon.specialization}</span>
            )}
          </div>
        )}

        {surgery.notes && (
          <div
            className="rounded-xl px-3 py-2 mb-4 text-[11px] text-slate-600 leading-relaxed"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}
          >
            <span className="font-semibold text-violet-600 mr-1">Notes:</span>
            <span className="line-clamp-2">{surgery.notes}</span>
          </div>
        )}

        {!isPast && statusKey !== "CANCELLED" && statusKey !== "COMPLETED" && (
          <div className="flex gap-2">
            <button
              onClick={() => onNotes(surgery)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-violet-700 border border-violet-200 hover:bg-violet-50 transition-colors"
            >
              <FileText size={13} />
              {surgery.notes ? "Edit Notes" : "Add Notes"}
            </button>
            <button
              onClick={() => onCancel(surgery.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <XCircle size={13} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DeviceTooltip ─────────────────────────────────────────────────────────────
function DeviceTooltip({ devices, visible }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (visible) {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 8, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" }
      );
    } else {
      gsap.to(ref.current, { opacity: 0, y: 4, scale: 0.97, duration: 0.15, ease: "power2.in" });
    }
  }, [visible]);

  const available = devices.filter(d => d.status === "AVAILABLE").length;
  const inUse     = devices.filter(d => d.status === "IN_USE").length;
  const issues    = devices.filter(d => d.status === "MAINTENANCE" || d.status === "OUT_OF_SERVICE").length;

  return (
    <div
      ref={ref}
      className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{
        bottom: "calc(100% + 10px)",
        opacity: 0,
        minWidth: "220px",
        maxWidth: "260px",
      }}
    >
      {/* Arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] w-3 h-3 rotate-45 border-r border-b border-white/30"
        style={{ background: "rgba(17,10,50,0.92)" }}
      />

      <div
        className="rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: "rgba(17,10,50,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between"
          style={{ background: "rgba(139,92,246,0.18)" }}
        >
          <div className="flex items-center gap-2">
            <Cpu size={11} className="text-violet-300" />
            <span className="text-[11px] font-bold text-white">Medical Devices</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold">
            {available > 0 && <span className="text-emerald-400">{available} ready</span>}
            {inUse > 0     && <span className="text-blue-400">{inUse} in use</span>}
            {issues > 0    && <span className="text-amber-400">{issues} issue{issues > 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* Device list */}
        <div className="px-3 py-2 space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {devices.length === 0 ? (
            <p className="text-[10px] text-white/40 text-center py-2 italic">No devices registered</p>
          ) : (
            devices.map(device => {
              const ds = DEVICE_STATUS[device.status] ?? DEVICE_STATUS.AVAILABLE;
              const DevIcon = ds.icon;
              return (
                <div key={device.id} className="flex items-center gap-2.5 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ds.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white font-semibold truncate leading-tight">{device.name}</p>
                    {device.type && (
                      <p className="text-[9px] text-white/40 truncate">{device.type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DevIcon size={9} className={
                      device.status === "AVAILABLE"      ? "text-emerald-400" :
                      device.status === "IN_USE"         ? "text-blue-400" :
                      device.status === "MAINTENANCE"    ? "text-amber-400" :
                      "text-red-400"
                    } />
                    <span className={`text-[9px] font-bold ${
                      device.status === "AVAILABLE"      ? "text-emerald-400" :
                      device.status === "IN_USE"         ? "text-blue-400" :
                      device.status === "MAINTENANCE"    ? "text-amber-400" :
                      "text-red-400"
                    }`}>{ds.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RoomButton ────────────────────────────────────────────────────────────────
function RoomButton({ room, occupied, active, onClick, roomSurgeries }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hoverTimerRef = useRef(null);
  const devices = room.devices ?? [];
  const availableCount = devices.filter(d => d.status === "AVAILABLE").length;

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setTooltipVisible(true);
    }, 1000); // 1 second delay
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setTooltipVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimerRef.current);
  }, []);

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Device tooltip — appears above the card after 1s hover */}
      {devices.length >= 0 && (
        <DeviceTooltip devices={devices} visible={tooltipVisible} />
      )}

      <button
        onClick={() => !occupied && onClick(room)}
        disabled={occupied}
        className={`relative rounded-2xl border p-4 text-left transition-all duration-200 w-full ${
          occupied
            ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
            : active
            ? "border-violet-400 shadow-lg shadow-violet-500/15"
            : "border-slate-200 hover:border-violet-300 hover:shadow-md"
        }`}
        style={active ? { background: "rgba(139,92,246,0.06)" } : {}}
      >
        {/* top accent bar when active */}
        {active && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-400 to-purple-500 rounded-t-2xl" />
        )}

        {/* Room icon + checkmark */}
        <div className="flex items-center justify-between mb-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            occupied ? "bg-slate-200" : active ? "bg-violet-100" : "bg-slate-100"
          }`}>
            <BedDouble size={16} className={active ? "text-violet-600" : "text-slate-500"} />
          </div>
          {active && (
            <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          )}
        </div>

        {/* Room name & type */}
        <p className={`text-sm font-bold mb-0.5 ${active ? "text-violet-700" : "text-slate-800"}`}>
          {room.name ?? `Room ${room.roomNumber}`}
        </p>
        <p className="text-[10px] text-slate-400 mb-2">
          {room.type ?? room.department?.name ?? "Operating"}
        </p>

        {/* Occupied notice */}
        {occupied && roomSurgeries.length > 0 && (
          <p className="text-[10px] text-amber-600 mb-2 font-medium">
            In use — {fmtTime(roomSurgeries[0].scheduledAt)}
          </p>
        )}

        {/* Device summary bar */}
        <div
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 mt-1"
          style={{
            background: active ? "rgba(139,92,246,0.08)" : "rgba(100,116,139,0.06)",
            border: "1px solid rgba(100,116,139,0.1)",
          }}
        >
          <Cpu size={9} className={active ? "text-violet-400" : "text-slate-400"} />
          {devices.length === 0 ? (
            <span className="text-[9px] text-slate-400 italic">No devices</span>
          ) : (
            <>
              <span className="text-[9px] font-semibold text-slate-500">
                {devices.length} device{devices.length !== 1 ? "s" : ""}
              </span>
              {/* Mini status dots */}
              <div className="ml-auto flex items-center gap-0.5">
                {devices.slice(0, 5).map(d => (
                  <span
                    key={d.id}
                    className={`w-1.5 h-1.5 rounded-full ${DEVICE_STATUS[d.status]?.dot ?? "bg-slate-400"}`}
                    title={d.name}
                  />
                ))}
                {devices.length > 5 && (
                  <span className="text-[8px] text-slate-400 ml-0.5">+{devices.length - 5}</span>
                )}
              </div>
            </>
          )}
          {/* Hover hint */}
          <span className="text-[8px] text-slate-300 ml-auto whitespace-nowrap hidden group-hover:block">
            Hold to see
          </span>
        </div>

        {/* Subtle "hover for devices" hint text */}
        {devices.length > 0 && !occupied && (
          <p className="text-[8px] text-slate-300 mt-1.5 text-center">
            hover to see devices
          </p>
        )}
      </button>
    </div>
  );
}

// ─── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ onClose, onSubmit, allRooms, myPatients, todaySurgeries }) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);

  const [step, setStep]                           = useState(1);
  const [selectedRoom, setSelectedRoom]           = useState(null);
  const [selectedPatient, setSelectedPatient]     = useState(null);
  const [scheduledAt, setScheduledAt]             = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes]                         = useState("");
  const [patientSearch, setPatientSearch]         = useState("");
  const [submitting, setSubmitting]               = useState(false);
  const [error, setError]                         = useState(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
    );
  }, []);

  const closeAnim = (cb) => {
    gsap.to(panelRef.current, { opacity: 0, y: 20, scale: 0.97, duration: 0.25, ease: "power2.in" });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, onComplete: cb });
  };

  const occupiedRoomIds = new Set(
    todaySurgeries
      .filter(s => {
        const st = getSurgeryStatus(s);
        return st !== "CANCELLED" && st !== "COMPLETED";
      })
      .map(s => s.roomId)
      .filter(Boolean)
  );

  const filteredPatients = myPatients.filter(p =>
    (p.user?.name ?? p.name ?? "").toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedRoom || !selectedPatient || !scheduledAt) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        patientId: selectedPatient.id,
        roomId: selectedRoom.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        notes: notes.trim() || undefined,
        surgeryType: "SCHEDULED",
      });
      closeAnim(onClose);
    } catch (e) {
      setError(e?.response?.data?.err ?? e?.response?.data?.message ?? e.message ?? "Failed to schedule surgery.");
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,10,40,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === overlayRef.current && closeAnim(onClose)}
    >
      <div
        ref={panelRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/30 shadow-2xl"
        style={{ background: "rgba(255,255,255,0.96)", scrollbarWidth: "thin" }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 px-7 py-5 flex items-center justify-between border-b border-slate-100"
          style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)" }}
        >
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Schedule Surgery</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 2 — {step === 1 ? "Choose a room" : "Set details"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: step === s ? "24px" : "8px",
                    background: step >= s ? "#8b5cf6" : "#e2e8f0",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => closeAnim(onClose)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-7 py-6">

          {/* STEP 1: Room grid */}
          {step === 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">
                  Select an operating room
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ({allRooms.filter(r => !occupiedRoomIds.has(r.id)).length} available)
                  </span>
                </p>
                {/* Hint pill */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] text-slate-500 border border-slate-200"
                  style={{ background: "rgba(139,92,246,0.04)" }}
                >
                  <Cpu size={9} className="text-violet-400" />
                  Hover 1s to see devices
                </div>
              </div>

              {todaySurgeries.filter(s => getSurgeryStatus(s) !== "CANCELLED").length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                    <Activity size={11} /> Today's occupied rooms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {todaySurgeries
                      .filter(s => {
                        const st = getSurgeryStatus(s);
                        return st !== "CANCELLED" && st !== "COMPLETED" && s.roomId;
                      })
                      .map(s => (
                        <span key={s.id} className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-semibold">
                          Room {s.room?.name ?? s.room?.roomNumber ?? s.roomId}
                          <span className="ml-1 font-normal opacity-70">
                            {fmtTime(s.scheduledAt)}
                          </span>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {allRooms.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No surgery rooms found.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allRooms.map(room => {
                    const occupied = occupiedRoomIds.has(room.id);
                    const active = selectedRoom?.id === room.id;
                    const roomSurgeries = todaySurgeries.filter(
                      s => s.roomId === room.id && getSurgeryStatus(s) !== "CANCELLED"
                    );
                    return (
                      <RoomButton
                        key={room.id}
                        room={room}
                        occupied={occupied}
                        active={active}
                        onClick={setSelectedRoom}
                        roomSurgeries={roomSurgeries}
                      />
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedRoom}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 6px 20px rgba(139,92,246,0.35)" }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-violet-200"
                style={{ background: "rgba(139,92,246,0.05)" }}
              >
                <BedDouble size={16} className="text-violet-500" />
                <span className="text-sm font-semibold text-violet-700">
                  {selectedRoom?.name ?? `Room ${selectedRoom?.roomNumber}`}
                </span>
                {/* Device summary in step 2 */}
                {(selectedRoom?.devices ?? []).length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    {(selectedRoom.devices ?? []).slice(0, 6).map(d => (
                      <span
                        key={d.id}
                        className={`w-1.5 h-1.5 rounded-full ${DEVICE_STATUS[d.status]?.dot ?? "bg-slate-400"}`}
                        title={`${d.name} — ${DEVICE_STATUS[d.status]?.label ?? d.status}`}
                      />
                    ))}
                    {(selectedRoom.devices ?? []).length > 6 && (
                      <span className="text-[9px] text-slate-400">+{selectedRoom.devices.length - 6}</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1"
                >
                  <ChevronLeft size={12} /> Change
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">
                    Scheduled at <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 90"
                    value={estimatedDuration}
                    onChange={e => setEstimatedDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Patient <span className="text-red-400">*</span>
                </label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients…"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100" style={{ scrollbarWidth: "thin" }}>
                  {filteredPatients.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No patients found</p>
                  ) : (
                    filteredPatients.map(p => {
                      const name = p.user?.name ?? p.name ?? "Patient";
                      const isSelected = selectedPatient?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? "bg-violet-50" : "hover:bg-slate-50"}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">{getInitials(name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-violet-700" : "text-slate-800"}`}>{name}</p>
                            <p className="text-[10px] text-slate-400">{p.user?.email ?? p.email ?? ""}</p>
                          </div>
                          {isSelected && <CheckCircle2 size={14} className="text-violet-500 ml-auto flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Surgical notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Pre-op instructions, anesthesia notes, special considerations…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedPatient || !scheduledAt}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 6px 20px rgba(139,92,246,0.35)" }}
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Scheduling…</>
                  ) : (
                    <><CalendarPlus size={15} /> Schedule Surgery</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notes Modal ──────────────────────────────────────────────────────────────
function NotesModal({ surgery, onClose, onSave }) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);
  const [notes, setNotes]   = useState(surgery.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 30, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.5)" }
    );
  }, []);

  const closeAnim = (cb) => {
    gsap.to(panelRef.current, { opacity: 0, y: 15, duration: 0.2 });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: cb });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(surgery.id, notes.trim());
      closeAnim(onClose);
    } catch (e) {
      setError(e?.response?.data?.err ?? e?.response?.data?.message ?? "Failed to save notes.");
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,10,40,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === overlayRef.current && closeAnim(onClose)}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-[1.75rem] border border-white/30 shadow-2xl"
        style={{ background: "rgba(255,255,255,0.97)" }}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Surgical Notes</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {surgery.patient?.user?.name ?? surgery.patient?.name ?? "Patient"}
            </p>
          </div>
          <button onClick={() => closeAnim(onClose)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <textarea
            rows={5}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Pre-op instructions, anesthesia notes, special considerations…"
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all resize-none"
          />
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => closeAnim(onClose)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DoctorSurgeries() {
  const wrapperRef  = useRef(null);
  const progressRef = useRef(null);
  const headerRef   = useRef(null);

  const [tab, setTab]                   = useState("today");
  const [todaySurgeries, setToday]      = useState([]);
  const [mySurgeries, setMySurgeries]   = useState([]);
  const [allSurgeries, setAllSurgeries] = useState([]);
  const [allRooms, setAllRooms]         = useState([]);
  const [myPatients, setMyPatients]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [notesTarget, setNotesTarget]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, myRes, roomsRes, apptsRes] = await Promise.all([
        surgeryAPI.getTodaySurgeries(),
        surgeryAPI.getDoctorSurgeries(),
        surgeryAPI.getSurgeryRooms(),
        doctorAPI.getMyAppointments(),
      ]);

      const todayList = Array.isArray(todayRes.data)
        ? todayRes.data
        : Array.isArray(todayRes.data?.data)
        ? todayRes.data.data
        : [];
      setToday(todayList);

      const myList = Array.isArray(myRes.data)
        ? myRes.data
        : Array.isArray(myRes.data?.data)
        ? myRes.data.data
        : [];
      setMySurgeries(myList);

      // Rooms now include devices[] from the updated service
      const roomsData = Array.isArray(roomsRes.data)
        ? roomsRes.data
        : Array.isArray(roomsRes.data?.rooms)
        ? roomsRes.data.rooms
        : [];
      setAllRooms(roomsData);

      const appointments = Array.isArray(apptsRes.data)
        ? apptsRes.data
        : apptsRes.data?.data ?? [];
      const seen = new Set();
      const uniquePatients = [];
      for (const appt of appointments) {
        const patient = appt.patient;
        if (patient && !seen.has(patient.id)) {
          seen.add(patient.id);
          uniquePatients.push(patient);
        }
      }
      setMyPatients(uniquePatients);

      try {
        const allRes = await surgeryAPI.getAllSurgeries();
        const allList = Array.isArray(allRes.data)
          ? allRes.data
          : Array.isArray(allRes.data?.data)
          ? allRes.data.data
          : [];
        setAllSurgeries(allList);
      } catch {
        setAllSurgeries([]);
      }

    } catch (e) {
      console.error("Failed to load surgery data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gsapRanRef = useRef(false);
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      gsap.set(progressRef.current, { scaleX: 0 });
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom bottom", scrub: 0,
        },
      });

      if (!gsapRanRef.current) {
        gsap.fromTo(headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }
        );
        gsapRanRef.current = true;
      }

      gsap.fromTo(".surgery-card",
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: "power2.out", delay: 0.1,
          clearProps: "transform,opacity" }
      );

      gsap.to(".glow-tl", {
        y: 100, x: 40, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, [loading, tab]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this surgery?")) return;
    try {
      await surgeryAPI.cancelSurgery(id);
      await loadData();
    } catch (e) {
      alert(e?.response?.data?.err ?? e?.response?.data?.message ?? "Failed to cancel.");
    }
  };

  const handleSchedule = async (payload) => {
    await surgeryAPI.createSurgery(payload);
    await loadData();
  };

  const handleSaveNotes = async (surgeryId, content) => {
    await surgeryAPI.updateNotes(surgeryId, content);
    await loadData();
  };

  const todayIds = new Set(todaySurgeries.map(s => s.id));
  const prevSurgeries = mySurgeries.filter(s => {
    const st = getSurgeryStatus(s);
    return !todayIds.has(s.id) && (st === "COMPLETED" || st === "CANCELLED");
  });

  const TABS = [
    { key: "today",    label: "Today",        count: todaySurgeries.length },
    { key: "mine",     label: "My Surgeries", count: mySurgeries.length },
    { key: "previous", label: "Previous",     count: prevSurgeries.length },
    ...(allSurgeries.length > 0
      ? [{ key: "all", label: "All Surgeries", count: allSurgeries.length, highlight: true }]
      : []),
  ];

  const displayList =
    tab === "today"    ? todaySurgeries :
    tab === "mine"     ? mySurgeries :
    tab === "previous" ? prevSurgeries :
    tab === "all"      ? allSurgeries :
    [];

  const inProgress = todaySurgeries.filter(s => getSurgeryStatus(s) === "IN_PROGRESS").length;
  const pending    = todaySurgeries.filter(s => getSurgeryStatus(s) === "PENDING").length;
  const completed  = todaySurgeries.filter(s => getSurgeryStatus(s) === "COMPLETED").length;

  return (
    <>
      <div
        ref={progressRef}
        style={{
          position: "fixed", top: 0, left: 0, height: "3px", width: "100%",
          transformOrigin: "left center", transform: "scaleX(0)",
          background: "linear-gradient(90deg,#8b5cf6,#6366f1,#d946ef)",
          zIndex: 9999, borderRadius: "0 2px 2px 0", pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{ backgroundImage: NOISE + ", linear-gradient(135deg,#f5f3ff 0%,#ede9fe 40%,#faf5ff 100%)" }}
      >
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[38rem] h-[38rem] rounded-full bg-violet-400/20 blur-[110px]" />
        <div className="pointer-events-none fixed bottom-[-6rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-purple-500/15 blur-[100px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 py-10 pb-24">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div ref={headerRef} className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Scissors size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Surgeries</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {allSurgeries.length > 0 && (
                  <button
                    onClick={() => setTab("all")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                      tab === "all"
                        ? "text-white border-transparent shadow-lg"
                        : "text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                    }`}
                    style={tab === "all" ? {
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
                    } : {}}
                  >
                    <LayoutGrid size={15} />
                    All Surgeries
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      tab === "all" ? "bg-white/20 text-white" : "bg-indigo-200 text-indigo-700"
                    }`}>
                      {allSurgeries.length}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setShowSchedule(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                    boxShadow: "0 8px 24px rgba(139,92,246,0.4)",
                  }}
                >
                  <CalendarPlus size={17} />
                  Schedule Surgery
                </button>
              </div>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: "In Progress", value: inProgress, color: "bg-blue-100 text-blue-700 border-blue-200" },
                { label: "Pending",     value: pending,    color: "bg-amber-100 text-amber-700 border-amber-200" },
                { label: "Completed",   value: completed,  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                { label: "Total Today", value: todaySurgeries.length, color: "bg-violet-100 text-violet-700 border-violet-200" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${color}`}>
                  <span className="text-lg font-black">{value}</span>
                  <span className="font-medium opacity-80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────── */}
          <div
            className="inline-flex rounded-2xl p-1 mb-6 border border-white/40 flex-wrap gap-1"
            style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)" }}
          >
            {TABS.map(({ key, label, count, highlight }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  tab === key ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-700"
                }`}
                style={tab === key ? {
                  background: highlight
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "linear-gradient(135deg,#8b5cf6,#7c3aed)"
                } : {}}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  tab === key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Content ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 size={36} className="text-violet-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading surgeries…</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border border-white/40"
                style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)" }}
              >
                <Scissors size={40} className="text-violet-400/50" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-700 mb-1">
                  {tab === "today"    ? "No surgeries today" :
                   tab === "mine"     ? "No surgeries found" :
                   tab === "previous" ? "No previous surgeries" :
                                        "No surgeries found"}
                </p>
                <p className="text-sm text-slate-400 max-w-xs">
                  {tab === "today"
                    ? "Schedule a surgery to get started."
                    : "Completed and cancelled surgeries will appear here."}
                </p>
              </div>
              {tab === "today" && (
                <button
                  onClick={() => setShowSchedule(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}
                >
                  <CalendarPlus size={15} /> Schedule Surgery
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayList.map(surgery => (
                <SurgeryCard
                  key={surgery.id}
                  surgery={surgery}
                  isPast={tab === "previous"}
                  showDoctor={tab === "all"}
                  onCancel={handleCancel}
                  onNotes={setNotesTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onSubmit={handleSchedule}
          allRooms={allRooms}
          myPatients={myPatients}
          todaySurgeries={todaySurgeries}
        />
      )}

      {notesTarget && (
        <NotesModal
          surgery={notesTarget}
          onClose={() => setNotesTarget(null)}
          onSave={handleSaveNotes}
        />
      )}
    </>
  );
}