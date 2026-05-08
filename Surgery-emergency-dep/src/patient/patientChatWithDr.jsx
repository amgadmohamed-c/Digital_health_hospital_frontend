import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageCircle,
  Send,
  Wifi,
  WifiOff,
  ChevronDown,
  Clock,
  CalendarDays,
  Stethoscope,
  AlertCircle,
  Loader2,
  CheckCheck,
  Check,
} from "lucide-react";
import { patientAPI, chatAPI } from "../auth/api"; 

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────────────────────────
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const STATUS_COLOR = {
  SCHEDULED: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  ACTIVE:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  COMPLETED: { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400" },
  CANCELLED: { bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppointmentCard({ appt, onSelect, isActive }) {
  const cardRef = useRef(null);
  const status = STATUS_COLOR[appt.status] ?? STATUS_COLOR.SCHEDULED;

  return (
    <button
      ref={cardRef}
      onClick={() => onSelect(appt)}
      className={`appt-card w-full text-left rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden group ${
        isActive
          ? "border-cyan-400/60 shadow-lg shadow-cyan-500/10"
          : "border-white/40 hover:border-cyan-300/40 hover:shadow-md"
      }`}
      style={{
        background: isActive
          ? "rgba(6,182,212,0.08)"
          : "rgba(255,255,255,0.46)",
        backdropFilter: "blur(16px)",
      }}
    >
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl" />
      )}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {appt.doctor?.user?.name ?? "Doctor"}
            </p>
            <p className="text-[11px] text-slate-500">
              {appt.doctor?.specialization ?? "Specialist"}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {appt.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays size={11} />
          {new Date(appt.scheduledAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {new Date(appt.scheduledAt).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
        <span className="ml-auto px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium">
          {appt.type}
        </span>
      </div>
    </button>
  );
}

function Message({ msg, isOwn, showTail }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 12, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" }
    );
  }, []);

  const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"} mb-1`}
    >
      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed relative shadow-sm ${
          isOwn
            ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-md"
            : "text-slate-800 rounded-bl-md border border-white/60"
        }`}
        style={
          isOwn
            ? { boxShadow: "0 4px 16px rgba(6,182,212,0.28)" }
            : { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(12px)" }
        }
      >
        {msg.content}
      </div>
      <div className={`flex items-center gap-1 px-1 text-[10px] text-slate-400 ${isOwn ? "flex-row-reverse" : ""}`}>
        <span>{time}</span>
        {isOwn && <CheckCheck size={12} className="text-cyan-400" />}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-2">
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-md border border-white/60 shadow-sm"
        style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400"
              style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientChat() {
  const wrapperRef      = useRef(null);
  const sidebarRef      = useRef(null);
  const chatPanelRef    = useRef(null);
  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const socketRef       = useRef(null);
  const progressRef     = useRef(null);

  const [appointments, setAppointments]   = useState([]);
  const [selectedAppt, setSelectedAppt]   = useState(null);
  const [session, setSession]             = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [connected, setConnected]         = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [loadingAppts, setLoadingAppts]   = useState(true);
  const [loadingChat, setLoadingChat]     = useState(false);
  const [sessionError, setSessionError]   = useState(null);
  const [patientId, setPatientId]         = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // ── Fetch patient + appointments ──────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Scroll progress bar
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom bottom", scrub: 0,
        },
      });

      // Sidebar entrance
      gsap.fromTo(sidebarRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.9, ease: "power4.out", delay: 0.1 }
      );

      // Chat panel entrance
      gsap.fromTo(chatPanelRef.current,
        { opacity: 0, x: 40, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 0.9, ease: "power4.out", delay: 0.25 }
      );

      // Ambient glows
      gsap.to(".chat-glow-tl", {
        y: 80, x: 30, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });
    }, wrapperRef);

    (async () => {
      try {
        const res = await patientAPI.getMe();
        const pid = res.data?.patient?.id ?? res.data?.id;
        setPatientId(pid);

        const apptRes = await patientAPI.getMyAppointments(pid);
        // Filter to ONLINE appointments only (chat is for ONLINE type)
        const online = (apptRes.data ?? []).filter(
          (a) => a.type === "ONLINE" && a.status !== "CANCELLED"
        );
        setAppointments(online);

        // Stagger cards after data loads
        setTimeout(() => {
          gsap.fromTo(".appt-card",
            { opacity: 0, y: 16, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" }
          );
        }, 50);
      } catch (e) {
        console.error("Failed to load appointments", e);
      } finally {
        setLoadingAppts(false);
      }
    })();

    return () => ctx.revert();
  }, []);

  // ── Disconnect socket on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ── Select appointment → create/get session → load history → connect socket
  const handleSelectAppointment = async (appt) => {
    if (selectedAppt?.id === appt.id) return;

    // Disconnect existing socket
    socketRef.current?.disconnect();
    setConnected(false);
    setMessages([]);
    setSession(null);
    setSessionError(null);
    setSelectedAppt(appt);
    setLoadingChat(true);

    // Animate panel transition
    gsap.fromTo(chatPanelRef.current,
      { opacity: 0.6, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
    );

    try {
      // 1. Get/create session
      const sessRes = await chatAPI.getSession(appt.id);
      const chatSession = sessRes.data;
      setSession(chatSession);

      // 2. Load message history
      const histRes = await chatAPI.getMessages(chatSession.id);
      setMessages(histRes.data?.messages ?? []);
      scrollToBottom(false);

      // 3. Connect socket
      const token = localStorage.getItem("access_token");
      const socket = io("http://localhost:8000", {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("join_session", chatSession.id);
      });

      socket.on("disconnect", () => setConnected(false));

      socket.on("new_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
        setIsTyping(false);
      });

      socket.on("session_ended", () => {
        setSessionError("This session has ended.");
        socket.disconnect();
      });

      socket.on("user_left", ({ message }) => {
        setIsTyping(false);
      });

      socket.on("error", ({ message }) => {
        setSessionError(message);
      });

      socketRef.current = socket;
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? "Failed to start chat.";
      setSessionError(msg);
    } finally {
      setLoadingChat(false);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected || !socketRef.current) return;

    // Optimistically add message
    const optimistic = {
      id: `opt-${Date.now()}`,
      content: text,
      senderType: "PATIENT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    socketRef.current.emit("send_message", text);

    // Animate send button
    gsap.fromTo(inputRef.current,
      { scale: 0.98 },
      { scale: 1, duration: 0.25, ease: "back.out(2)" }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed", top: 0, left: 0, height: "3px", width: "100%",
          transformOrigin: "left center", transform: "scaleX(0)",
          background: "linear-gradient(90deg,#06b6d4,#6366f1,#f43f5e)",
          zIndex: 9999, borderRadius: "0 2px 2px 0", pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{
          backgroundImage:
            NOISE + ", linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)",
        }}
      >
        {/* Ambient glows */}
        <div className="chat-glow-tl pointer-events-none fixed top-[-6rem] left-[-6rem] w-[32rem] h-[32rem] rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="pointer-events-none fixed bottom-[-6rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-indigo-500/15 blur-[100px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 py-8 h-screen flex flex-col">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Chat with Your Doctor
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Select an online appointment to start a real-time session
              </p>
            </div>
          </div>

          {/* ── Main layout ───────────────────────────────────────────────── */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-0">

            {/* ── LEFT: Appointment list ──────────────────────────────────── */}
            <div
              ref={sidebarRef}
              className="flex flex-col gap-3 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin" }}
            >
              <div
                className="rounded-[1.75rem] border border-white/40 shadow-xl overflow-hidden flex flex-col h-full"
                style={{ background: "rgba(255,255,255,0.46)", backdropFilter: "blur(20px)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays size={14} className="text-cyan-600" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
                      Online Appointments
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {appointments.length} session{appointments.length !== 1 ? "s" : ""} available
                  </p>
                </div>

                <div className="px-4 pb-5 flex-1 overflow-y-auto space-y-3" style={{ scrollbarWidth: "thin" }}>
                  {loadingAppts ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 size={28} className="text-cyan-500 animate-spin" />
                      <span className="text-sm text-slate-400">Loading appointments…</span>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <CalendarDays size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">No online appointments</p>
                      <p className="text-xs text-slate-400 max-w-[180px]">
                        Book an ONLINE appointment to chat with your doctor.
                      </p>
                    </div>
                  ) : (
                    appointments.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        onSelect={handleSelectAppointment}
                        isActive={selectedAppt?.id === appt.id}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Chat panel ───────────────────────────────────────── */}
            <div
              ref={chatPanelRef}
              className="flex flex-col rounded-[1.75rem] border border-white/40 shadow-2xl overflow-hidden min-h-0"
              style={{ background: "rgba(255,255,255,0.46)", backdropFilter: "blur(20px)" }}
            >
              {/* Chat header */}
              <div
                className="px-6 py-4 border-b border-white/40 flex items-center justify-between flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.6)" }}
              >
                {selectedAppt ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
                        <Stethoscope size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {selectedAppt.doctor?.user?.name ?? "Your Doctor"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {selectedAppt.doctor?.specialization ?? "Specialist"}
                          {" · "}
                          {new Date(selectedAppt.scheduledAt).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingChat ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Loader2 size={12} className="animate-spin" /> Connecting…
                        </span>
                      ) : connected ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                          <WifiOff size={12} />
                          Offline
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">No session selected</span>
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto px-6 py-5 relative"
                style={{ scrollbarWidth: "thin" }}
                onScroll={handleScroll}
              >
                {!selectedAppt ? (
                  /* Empty state */
                  <div className="h-full flex flex-col items-center justify-center gap-5 text-center select-none">
                    <div
                      className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl"
                      style={{
                        background: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(99,102,241,0.12))",
                        border: "1.5px solid rgba(255,255,255,0.6)",
                      }}
                    >
                      <MessageCircle size={40} className="text-cyan-500/60" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700 mb-1">Start a Conversation</p>
                      <p className="text-sm text-slate-400 max-w-[240px]">
                        Pick an online appointment from the left to open your chat session.
                      </p>
                    </div>
                  </div>
                ) : loadingChat ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="text-cyan-500 animate-spin" />
                    <p className="text-sm text-slate-400">Loading messages…</p>
                  </div>
                ) : sessionError ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                      <AlertCircle size={24} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Session unavailable</p>
                      <p className="text-xs text-slate-400 max-w-[220px]">{sessionError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center">
                          <MessageCircle size={22} className="text-cyan-400" />
                        </div>
                        <p className="text-sm text-slate-400">
                          No messages yet. Say hello!
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {messages.map((msg, i) => {
                          const isOwn = msg.senderType === "PATIENT";
                          return (
                            <Message
                              key={msg.id}
                              msg={msg}
                              isOwn={isOwn}
                              showTail={
                                i === messages.length - 1 ||
                                messages[i + 1]?.senderType !== msg.senderType
                              }
                            />
                          );
                        })}
                        {isTyping && <TypingIndicator />}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white border border-white/60 shadow-lg flex items-center justify-center text-slate-500 hover:text-cyan-600 transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                )}
              </div>

              {/* Input bar */}
              <div
                className="px-5 py-4 border-t border-white/40 flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.62)" }}
              >
                <div className="flex items-end gap-3">
                  <div
                    ref={inputRef}
                    className="flex-1 rounded-2xl border border-white/60 overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}
                  >
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        !selectedAppt
                          ? "Select an appointment to chat…"
                          : !connected
                          ? "Connecting…"
                          : "Type a message… (Enter to send)"
                      }
                      disabled={!connected || !selectedAppt || !!sessionError}
                      rows={1}
                      className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none outline-none"
                      style={{ maxHeight: "120px", overflowY: "auto" }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !connected || !selectedAppt || !!sessionError}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
                    style={{
                      background: "linear-gradient(135deg,#06b6d4,#3b82f6)",
                      boxShadow: "0 6px 20px rgba(6,182,212,0.35)",
                    }}
                  >
                    <Send size={18} className="text-white" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pl-1">
                  Press <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}