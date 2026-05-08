import {
  CalendarDays,
  MessageCircle,
  Scissors,
  User,
  FileText,
  ArrowRight,
  ShieldCheck,
  Zap,
  Heart,
  Link2,
  BarChart3,
} from "lucide-react";

import { Link } from "react-router";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LandingSections from "./components/landingSections";

gsap.registerPlugin(ScrollTrigger);

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const features = [
  {
    title: "Upcoming Surgeries",
    description: "View your scheduled surgeries and stay updated with important details.",
    icon: Scissors,
    link: "/patient/surgeries",
    gradient: "from-pink-500 to-rose-500",
    accent: "#f43f5e",
  },
  {
    title: "Chat With Doctor",
    description: "Securely communicate with your doctor anytime you need assistance.",
    icon: MessageCircle,
    link: "/patient/chat",
    gradient: "from-cyan-500 to-blue-500",
    accent: "#06b6d4",
  },
  {
    title: "Appointments",
    description: "Manage appointments, reschedule visits, and track upcoming meetings.",
    icon: CalendarDays,
    link: "/patient/appointments",
    gradient: "from-violet-500 to-purple-500",
    accent: "#8b5cf6",
  },
  {
    title: "Medical History",
    description: "Update and review your medical records and treatment history.",
    icon: FileText,
    link: "/patient/history",
    gradient: "from-emerald-500 to-teal-500",
    accent: "#10b981",
  },
  {
    title: "Profile Settings",
    description: "Edit your profile information and personalize your account.",
    icon: User,
    link: "/patient/profile",
    gradient: "from-orange-500 to-amber-500",
    accent: "#f97316",
  },
];

const coreValues = [
  { icon: ShieldCheck, label: "Safety",     color: "text-cyan-700",    ring: "#0e7490" },
  { icon: Zap,         label: "Speed",      color: "text-blue-700",    ring: "#1d4ed8" },
  { icon: Heart,       label: "Care",       color: "text-rose-600",    ring: "#e11d48" },
  { icon: Link2,       label: "Connection", color: "text-purple-700",  ring: "#7c3aed" },
  { icon: BarChart3,   label: "Clarity",    color: "text-emerald-700", ring: "#047857" },
];

export default function PatientDashboard() {
  const wrapperRef   = useRef(null);
  const heroRef      = useRef(null);
  const heroInnerRef = useRef(null);
  const featuresRef  = useRef(null);
  const storyRef     = useRef(null);
  const imageRef     = useRef(null);
  const coreRef      = useRef(null);
  const progressRef  = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // GPU compositing hints
      gsap.set(
        [heroInnerRef.current, featuresRef.current, storyRef.current, coreRef.current],
        { willChange: "transform, opacity" }
      );

      // ── 1. HERO entrance ──────────────────────────────────────────
      gsap.timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-badge",  { opacity: 0, y: 20 },              { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(".hero-title",  { opacity: 0, y: 52, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.2 }, "-=0.45")
        .fromTo(".hero-body",   { opacity: 0, y: 30 },              { opacity: 1, y: 0, duration: 1 }, "-=0.65")
        .fromTo(".hero-scroll", { opacity: 0 },                     { opacity: 1, duration: 0.6 }, "-=0.3");

      // Hero parallax exit — floats up and fades as you scroll past
      gsap.to(heroInnerRef.current, {
        y: -90,
        scale: 0.95,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // ── 2. FEATURES section entrance + card stagger ───────────────
      gsap.fromTo(
        featuresRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: featuresRef.current, start: "top 88%", once: true },
        }
      );
      gsap.set(".feature-card", { opacity: 0, y: 30, scale: 0.96 });
 
      gsap.to(".feature-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,          // short per-card duration
        stagger: 0.07,          // only 70ms between each card, not spread
        ease: "power2.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          once: true,
          invalidateOnRefresh: true,
        },
      });
 

      // ── 3. STORY split reveal ─────────────────────────────────────
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, x: -70, scale: 0.94, rotate: -2 },
        {
          opacity: 1, x: 0, scale: 1, rotate: 0,
          duration: 1.4, ease: "power4.out",
          scrollTrigger: { trigger: storyRef.current, start: "top 75%", once: true },
        }
      );

      gsap.fromTo(
        ".story-content",
        { opacity: 0, x: 70, scale: 0.96 },
        {
          opacity: 1, x: 0, scale: 1,
          duration: 1.4, ease: "power4.out",
          scrollTrigger: { trigger: storyRef.current, start: "top 75%", once: true },
        }
      );

      // Image inner parallax — image drifts slower than scroll (Ken Burns lite)
      gsap.to(".story-img", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // ── 4. CORE VALUES cascade ────────────────────────────────────
      gsap.fromTo(
        ".core-title",
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ".core-title", start: "top 90%", once: true },
        }
      );

      const coreCards = Array.from(coreRef.current.querySelectorAll(".core-card"));
      gsap.set(coreCards, { opacity: 0, y: 50, scale: 0.84 });
      gsap.to(coreCards, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.75,
        stagger: { amount: 0.5, from: "center" },
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: coreRef.current,
          start: "top 88%",
          once: true,
          invalidateOnRefresh: true,
        },
      });

      // ── 5. AMBIENT GLOW parallax ──────────────────────────────────
      gsap.to(".glow-tl", {
        y: 140, x: 50, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });
      gsap.to(".glow-br", {
        y: -140, x: -50, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });
      gsap.to(".glow-mid", {
        y: -80, ease: "none",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top bottom", end: "bottom top", scrub: 1.5,
        },
      });

      // ── 6. SCROLL PROGRESS BAR ────────────────────────────────────
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0,
        },
      });

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Fixed scroll progress bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          width: "100%",
          transformOrigin: "left center",
          transform: "scaleX(0)",
          background: "linear-gradient(90deg,#06b6d4,#6366f1,#f43f5e)",
          zIndex: 9999,
          borderRadius: "0 2px 2px 0",
          pointerEvents: "none",
        }}
      />

      <div
        ref={wrapperRef}
        className="min-h-screen relative overflow-x-hidden"
        style={{
          backgroundImage:
            NOISE +
            ", linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#eff6ff 100%)",
        }}
      >
        {/* Ambient glow orbs */}
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[40rem] h-[40rem] rounded-full bg-cyan-400/20 blur-[110px]" />
        <div className="glow-br pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[40rem] h-[40rem] rounded-full bg-indigo-500/20 blur-[110px]" />
        <div className="glow-mid pointer-events-none absolute top-[110vh] left-1/2 -translate-x-1/2 w-[55rem] h-[32rem] rounded-full bg-violet-400/10 blur-[130px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 pb-40">

          {/* ══════════════════════════════════════════
              SCENE 1 — HERO
          ══════════════════════════════════════════ */}
          <section
            ref={heroRef}
            className="min-h-[82vh] flex items-center pt-16 pb-8"
          >
            <div ref={heroInnerRef} className="w-full max-w-4xl">
              <div
                className="relative backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] p-10 md:p-14 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.46)" }}
              >
                {/* Top shimmer edge */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                {/* Decorative blur pill */}
                <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-gradient-to-br from-cyan-400/25 to-indigo-400/15 blur-2xl pointer-events-none" />

                <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 text-cyan-700 text-sm font-semibold border border-cyan-400/30 tracking-wide mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  Patient Dashboard
                </span>

                <h1 className="hero-title text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                  Welcome Back{" "}
                  <span
                    className="inline-block"
                    style={{ animation: "wave 2.2s ease-in-out infinite" }}
                  >
                    👋
                  </span>
                </h1>

                <p className="hero-body text-slate-600 text-xl md:text-2xl max-w-2xl leading-relaxed">
                  Access your surgeries, appointments, medical records, and
                  communicate with your healthcare providers — all in one place.
                </p>

                <div className="hero-scroll mt-10 flex items-center gap-3 text-slate-400 text-xs tracking-[0.2em] uppercase select-none">
                  <span className="flex flex-col gap-[3px]">
                    <span className="w-4 h-[2px] rounded bg-slate-400" />
                    <span className="w-4 h-[2px] rounded bg-slate-400 opacity-50" />
                    <span className="w-4 h-[2px] rounded bg-slate-400 opacity-20" />
                  </span>
                  Scroll to explore
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SCENE 2 — FEATURES
          ══════════════════════════════════════════ */}
          <section ref={featuresRef} className="mt-12 mb-8">
            <div className="mb-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-400">
                Quick Access
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              style={{ perspective: "1200px" }}
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    to={feature.link}
                    className="feature-card group relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[2rem] p-7 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl block"
                    style={{ background: "rgba(255,255,255,0.46)" }}
                  >
                    {/* Hover gradient bloom */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-15 bg-gradient-to-br ${feature.gradient} transition-opacity duration-500 rounded-[2rem]`}
                    />
                    {/* Top accent bar */}
                    <div
                      className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r ${feature.gradient} rounded-b-full opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    {/* Top shimmer */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                    <div className="relative z-10 flex flex-col gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                        style={{ boxShadow: `0 8px 24px ${feature.accent}38` }}
                      >
                        <Icon className="text-white" size={26} />
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">{feature.title}</h2>
                        <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>

                      <div
                        className="flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-4"
                        style={{ color: feature.accent }}
                      >
                        <span>Open</span>
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SCENE 3 — STORY
          ══════════════════════════════════════════ */}
          <section ref={storyRef} className="mt-36 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Image with inner parallax */}
              <div
                ref={imageRef}
                className="relative overflow-hidden rounded-[2.5rem] shadow-2xl h-[520px] border border-white/30"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop"
                  alt="Surgery"
                  className="story-img absolute inset-0 w-full h-[130%] object-cover object-center"
                  style={{ top: "-15%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-300 block mb-3">
                    Innovation
                  </span>
                  <h2 className="text-3xl font-black mb-3 leading-tight">
                    Innovation In<br />Healthcare
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                    Modern healthcare built around patient comfort and accessibility.
                  </p>
                </div>
              </div>

              {/* Text */}
              <div className="story-content">
                <div
                  className="relative backdrop-blur-2xl border border-white/40 rounded-[2rem] p-10 shadow-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                  <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/10 blur-2xl pointer-events-none" />

                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-600 block mb-5">
                    Our Story
                  </span>

                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6">
                    The History<br />Behind{" "}
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      MediCore
                    </span>
                  </h2>

                  <p className="text-slate-700 text-lg leading-relaxed mb-4">
                    MediCore was created to modernize the healthcare experience
                    and help patients stay connected with their doctors and surgeries.
                  </p>

                  <p className="text-slate-500 leading-relaxed">
                    Our platform combines communication, scheduling, and medical
                    management into one seamless experience.
                  </p>

                  {/* Stat pills */}
                  <div className="flex flex-wrap gap-3 mt-8">
                    {[["10k+", "Patients"], ["500+", "Doctors"], ["99.9%", "Uptime"]].map(
                      ([val, lbl]) => (
                        <div
                          key={lbl}
                          className="flex flex-col items-center px-5 py-3 rounded-2xl border border-white/50 backdrop-blur-sm"
                          style={{ background: "rgba(255,255,255,0.42)" }}
                        >
                          <span className="text-2xl font-black text-slate-900">{val}</span>
                          <span className="text-xs text-slate-500 font-medium">{lbl}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SCENE 4 — CORE VALUES
          ══════════════════════════════════════════ */}
          <section className="mt-36">
            <div className="text-center mb-14">
              <span className="core-title text-[10px] font-bold tracking-[0.35em] uppercase text-slate-400 block mb-4">
                What We Stand For
              </span>
              <h2 className="core-title text-4xl md:text-5xl font-black text-slate-900">
                Our Core Values
              </h2>
            </div>

            <div
              ref={coreRef}
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5"
            >
              {coreValues.map(({ icon: Icon, label, color, ring }) => (
                <div
                  key={label}
                  className="core-card group text-center backdrop-blur-2xl border border-white/40 rounded-3xl p-7 shadow-xl relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-default"
                  style={{ background: "rgba(255,255,255,0.46)" }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  {/* Hover ring glow */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 0 1.5px ${ring}50` }}
                  />

                  <div
                    className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: `${ring}18`,
                      boxShadow: `0 4px 16px ${ring}28`,
                    }}
                  >
                    <Icon className={`w-7 h-7 ${color}`} />
                  </div>
                  <p className="font-bold text-slate-800 text-sm tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </section>
          <LandingSections />

        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%,100% { transform: rotate(0deg);  }
          20%      { transform: rotate(20deg); }
          40%      { transform: rotate(-8deg); }
          60%      { transform: rotate(16deg); }
          80%      { transform: rotate(-4deg); }
        }
      `}</style>
    </>
  );
}