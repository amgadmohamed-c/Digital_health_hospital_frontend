import { useEffect, useRef } from "react";
import {
  Scissors,
  Heart,
  ShieldCheck,
  Star,
  Award,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Activity,
  Users,
  TrendingUp,
  Stethoscope,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router";
gsap.registerPlugin(ScrollTrigger);

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const doctors = [
  {
    name: "Dr. Sarah Caldwell",
    specialty: "Cardiothoracic Surgery",
    experience: "18 Years",
    rating: 4.9,
    surgeries: "3,200+",
    education: "Harvard Medical School",
    gradient: "from-cyan-500 to-blue-600",
    accent: "#06b6d4",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Pioneering minimally invasive cardiac procedures with a 98.7% success rate.",
  },
  {
    name: "Dr. Marcus Webb",
    specialty: "Neurosurgery",
    experience: "22 Years",
    rating: 4.8,
    surgeries: "4,100+",
    education: "Johns Hopkins University",
    gradient: "from-violet-500 to-purple-600",
    accent: "#8b5cf6",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Specialist in complex spinal and brain tumor resections with robotic assistance.",
  },
  {
    name: "Dr. Aisha Okonkwo",
    specialty: "Orthopedic Surgery",
    experience: "14 Years",
    rating: 5.0,
    surgeries: "2,800+",
    education: "Stanford University",
    gradient: "from-emerald-500 to-teal-600",
    accent: "#10b981",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Expert in joint replacement and sports injury reconstruction for elite athletes.",
  },
  {
    name: "Dr. Ethan Rosenberg",
    specialty: "General & Laparoscopic",
    experience: "11 Years",
    rating: 4.7,
    surgeries: "1,950+",
    education: "Mayo Clinic School of Medicine",
    gradient: "from-rose-500 to-pink-600",
    accent: "#f43f5e",
    image: "https://randomuser.me/api/portraits/men/56.jpg",
    bio: "Innovator in single-incision laparoscopic surgery with minimal recovery times.",
  },
  {
    name: "Dr. Leila Mansouri",
    specialty: "Vascular Surgery",
    experience: "16 Years",
    rating: 4.9,
    surgeries: "2,500+",
    education: "UCLA School of Medicine",
    gradient: "from-orange-500 to-amber-500",
    accent: "#f97316",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    bio: "Leading specialist in endovascular aortic repair and peripheral artery disease.",
  },
  {
    name: "Dr. James Thornton",
    specialty: "Pediatric Surgery",
    experience: "19 Years",
    rating: 4.8,
    surgeries: "3,600+",
    education: "Duke University School of Medicine",
    gradient: "from-blue-500 to-indigo-600",
    accent: "#6366f1",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    bio: "Compassionate specialist dedicated to neonatal and childhood surgical interventions.",
  },
];

const milestones = [
  {
    year: "1987",
    title: "Department Founded",
    description:
      "The Surgery Department was established with a vision to provide world-class surgical care to every patient.",
    icon: Scissors,
    accent: "#06b6d4",
  },
  {
    year: "1998",
    title: "First Robotic Surgery",
    description:
      "MediCore became one of the first hospitals in the region to perform robot-assisted surgical procedures.",
    icon: Activity,
    accent: "#8b5cf6",
  },
  {
    year: "2007",
    title: "Center of Excellence",
    description:
      "Awarded national recognition as a Center of Surgical Excellence with top rankings in outcomes and safety.",
    icon: Award,
    accent: "#10b981",
  },
  {
    year: "2015",
    title: "10,000 Surgeries Milestone",
    description:
      "Surpassed 10,000 successful surgical procedures, cementing our place as a regional leader in surgical care.",
    icon: TrendingUp,
    accent: "#f43f5e",
  },
  {
    year: "2022",
    title: "AI-Assisted Diagnostics",
    description:
      "Launched an AI-driven pre-surgical planning program, reducing complication rates by 32%.",
    icon: ShieldCheck,
    accent: "#f97316",
  },
  {
    year: "2024",
    title: "New Surgical Wing",
    description:
      "Opened the state-of-the-art 12-theatre surgical wing equipped with the latest imaging and robotic technology.",
    icon: Heart,
    accent: "#6366f1",
  },
];

const stats = [
  { value: "18,500+", label: "Surgeries Performed", icon: Scissors },
  { value: "98.4%", label: "Success Rate", icon: TrendingUp },
  { value: "200+", label: "Surgical Staff", icon: Users },
  { value: "37 Yrs", label: "of Excellence", icon: Award },
];

const specialties = [
  "Cardiothoracic", "Neurosurgery", "Orthopedics",
  "Vascular", "Oncological", "Laparoscopic",
  "Pediatric", "Plastic & Reconstructive",
];

export default function SurgeryDepartment() {
  const navigate = useNavigate();

  const wrapperRef   = useRef(null);
  const heroRef      = useRef(null);
  const heroInnerRef = useRef(null);
  const progressRef  = useRef(null);
  const historyRef   = useRef(null);
  const doctorsRef   = useRef(null);
  const statsRef     = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        [heroInnerRef.current, historyRef.current, doctorsRef.current],
        { willChange: "transform, opacity" }
      );

      // ── Hero entrance ──────────────────────────────────────────
      gsap.timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".hero-badge",  { opacity: 0, y: 20 },              { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(".hero-title",  { opacity: 0, y: 60, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.3 }, "-=0.4")
        .fromTo(".hero-sub",    { opacity: 0, y: 30 },              { opacity: 1, y: 0, duration: 1 }, "-=0.7")
        .fromTo(".hero-tags",   { opacity: 0, y: 20 },              { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
        .fromTo(".hero-cta",    { opacity: 0, scale: 0.9 },         { opacity: 1, scale: 1, duration: 0.6 }, "-=0.5")
        .fromTo(".hero-scroll", { opacity: 0 },                     { opacity: 1, duration: 0.5 }, "-=0.2")
        .fromTo(".hero-right",  { opacity: 0, x: 50, scale: 0.97 }, { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: "power3.out" }, "-=1.2");

      // Hero parallax exit
      gsap.to(heroInnerRef.current, {
        y: -80, scale: 0.96, opacity: 0, ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top", end: "bottom top", scrub: 1,
        },
      });

      // ── Stats bar ──────────────────────────────────────────────
      gsap.fromTo(".stat-item",
        { opacity: 0, y: 35, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7,
          stagger: 0.12, ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: statsRef.current, start: "top 88%", once: true,
          },
        }
      );

      // ── History timeline ───────────────────────────────────────
      gsap.fromTo(".history-heading",
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ".history-heading", start: "top 90%", once: true },
        }
      );

      const milestoneEls = Array.from(historyRef.current.querySelectorAll(".milestone-card"));
      milestoneEls.forEach((el, i) => {
        const dir = i % 2 === 0 ? -60 : 60;
        gsap.fromTo(el,
          { opacity: 0, x: dir, scale: 0.93 },
          {
            opacity: 1, x: 0, scale: 1,
            duration: 0.9, ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });

      // timeline line draw
      gsap.fromTo(".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1, duration: 1.8, ease: "power2.inOut",
          scrollTrigger: { trigger: historyRef.current, start: "top 80%", once: true },
        }
      );

      // ── Doctor cards ───────────────────────────────────────────
      gsap.fromTo(".doctors-heading",
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ".doctors-heading", start: "top 90%", once: true },
        }
      );

      const docCards = Array.from(doctorsRef.current.querySelectorAll(".doctor-card"));
      gsap.set(docCards, { opacity: 0, y: 60, scale: 0.92, rotateY: 8 });
      gsap.to(docCards, {
        opacity: 1, y: 0, scale: 1, rotateY: 0,
        duration: 0.8,
        stagger: { amount: 0.7, from: "start" },
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: doctorsRef.current, start: "top 82%", once: true },
      });

      // ── CTA section ────────────────────────────────────────────
      gsap.fromTo(".cta-section",
        { opacity: 0, y: 50, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 88%", once: true },
        }
      );

      // ── Ambient glows parallax ─────────────────────────────────
      gsap.to(".glow-tl", {
        y: 160, x: 60, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });
      gsap.to(".glow-br", {
        y: -160, x: -60, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom top", scrub: 2,
        },
      });

      // ── Scroll progress bar ────────────────────────────────────
      gsap.to(progressRef.current, {
        scaleX: 1, ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top", end: "bottom bottom", scrub: 0,
        },
      });

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Scroll progress */}
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
        {/* Ambient glow orbs */}
        <div className="glow-tl pointer-events-none fixed top-[-8rem] left-[-8rem] w-[42rem] h-[42rem] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="glow-br pointer-events-none fixed bottom-[-8rem] right-[-8rem] w-[42rem] h-[42rem] rounded-full bg-indigo-500/20 blur-[120px]" />

        <div className="relative z-10 px-4 md:px-8 xl:px-16 pb-40">

          {/* ════════════════════════════════════
              HERO
          ════════════════════════════════════ */}
          <section
            ref={heroRef}
            className="min-h-screen flex items-center pt-16 pb-8"
          >
            <div ref={heroInnerRef} className="w-full">
              <div
                className="relative backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] p-10 md:p-16 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.46)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/15 blur-3xl pointer-events-none" />
                <div className="absolute -top-8 right-1/4 w-48 h-48 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                  {/* LEFT — text */}
                  <div>
                    <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 text-cyan-700 text-sm font-semibold border border-cyan-400/30 tracking-wide mb-8">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      Department of Surgery · MediCore
                    </span>

                    <h1 className="hero-title text-5xl md:text-6xl xl:text-7xl font-black text-slate-900 tracking-tight leading-[1.02] mb-7">
                      Precision.<br />
                      <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                        Expertise.
                      </span>
                      <br />
                      Compassion.
                    </h1>

                    <p className="hero-sub text-slate-600 text-lg md:text-xl leading-relaxed mb-8">
                      Our world-class surgical team delivers life-changing procedures
                      with the highest standards of patient care — from routine operations
                      to the most complex interventions.
                    </p>

                    {/* Specialty tags */}
                    <div className="hero-tags flex flex-wrap gap-2 mb-10">
                      {specialties.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-white/60 border border-slate-200/70 text-slate-600 backdrop-blur-sm"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="hero-cta flex flex-wrap gap-4">
                      <button
                        className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                        style={{
                          background: "linear-gradient(135deg,#06b6d4,#6366f1)",
                          boxShadow: "0 8px 28px #06b6d440",
                        }}
                        onClick={()=>{
                            navigate("/signin")
                          
                        }}
                      >
                        Book a Consultation
                      </button>
                      <button className="px-8 py-3.5 rounded-2xl font-bold text-sm tracking-wide text-slate-700 border border-slate-200/80 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"  onClick={()=>{
                        navigate("/signin")
                      }}>
                        Meet Our Surgeons
                      </button>
                    </div>
                  </div>

                  {/* RIGHT — visual panel */}
                  <div className="hero-right hidden lg:flex flex-col gap-5">

                    {/* Surgery image */}
                    <div className="relative rounded-[1.75rem] overflow-hidden h-56 border border-white/30 shadow-xl">
                      <img
                        src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?q=80&w=900&auto=format&fit=crop"
                        alt="Surgery in progress"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-cyan-300 mb-1">Live OR Suite</p>
                        <p className="text-sm font-black">State-of-the-Art Theatres</p>
                      </div>
                      {/* Live indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-[10px] text-white font-bold tracking-wide">LIVE</span>
                      </div>
                    </div>

                    {/* Two mini cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Next surgery card */}
                      <div
                        className="rounded-2xl p-5 border border-white/50 shadow-lg relative overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.6)" }}
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                        <Stethoscope className="w-5 h-5 text-cyan-500 mb-3" />
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Today's Surgeries</p>
                        <p className="text-3xl font-black text-slate-900">14</p>
                        <p className="text-xs text-emerald-500 font-semibold mt-1">↑ 3 from yesterday</p>
                      </div>

                      {/* Success rate */}
                      <div
                        className="rounded-2xl p-5 border border-white/50 shadow-lg relative overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.6)" }}
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                        <ShieldCheck className="w-5 h-5 text-emerald-500 mb-3" />
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Success Rate</p>
                        <p className="text-3xl font-black text-slate-900">98.4%</p>
                        <p className="text-xs text-cyan-500 font-semibold mt-1">National avg: 94.1%</p>
                      </div>
                    </div>

                    {/* Next available doctor strip */}
                    <div
                      className="rounded-2xl p-4 border border-white/50 shadow-lg flex items-center gap-4 relative overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.6)" }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                      <div className="flex -space-x-3">
                        {["women/44", "men/32", "women/68"].map((p) => (
                          <img
                            key={p}
                            src={`https://randomuser.me/api/portraits/${p}.jpg`}
                            className="w-9 h-9 rounded-full border-2 border-white object-cover"
                            alt="surgeon"
                          />
                        ))}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">3 surgeons available now</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Next slot: Today at 3:00 PM</p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"
                      />
                    </div>

                  </div>
                </div>

                <div className="hero-scroll mt-12 flex items-center gap-3 text-slate-400 text-xs tracking-[0.2em] uppercase select-none">
                  <ChevronDown size={14} className="animate-bounce" />
                  Scroll to explore
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              STATS BAR
          ════════════════════════════════════ */}
          <section ref={statsRef} className="mb-8">
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-5 backdrop-blur-2xl border border-white/40 rounded-[2rem] p-6 shadow-xl"
              style={{ background: "rgba(255,255,255,0.46)" }}
            >
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="stat-item text-center py-4">
                  <div
                    className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(6,182,212,0.1)" }}
                  >
                    <Icon className="text-cyan-600 w-5 h-5" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
                  <div className="text-xs text-slate-500 font-medium tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════
              HISTORY / TIMELINE
          ════════════════════════════════════ */}
          <section className="mt-32 mb-8">
            <div className="history-heading text-center mb-16">
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-400 block mb-4">
                Our Journey
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                Decades of{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                  Surgical Excellence
                </span>
              </h2>
              <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
                From our founding through today, every milestone has been driven by
                a single purpose — better outcomes for every patient.
              </p>
            </div>

            <div ref={historyRef} className="relative max-w-4xl mx-auto">
              {/* Vertical line */}
              <div
                className="timeline-line absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] origin-top"
                style={{
                  background: "linear-gradient(180deg,#06b6d4,#6366f1,#f43f5e,#10b981)",
                }}
              />

              <div className="space-y-12">
                {milestones.map((m, i) => {
                  const Icon = m.icon;
                  const isLeft = i % 2 === 0;
                  return (
                    <div
                      key={m.year}
                      className={`milestone-card relative flex items-center gap-8 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
                    >
                      {/* Card */}
                      <div className={`w-[calc(50%-2rem)] ${isLeft ? "text-right" : "text-left"}`}>
                        <div
                          className="relative backdrop-blur-2xl border border-white/40 rounded-[1.5rem] p-6 shadow-xl overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.52)" }}
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                          {/* Colored accent line */}
                          <div
                            className={`absolute top-0 ${isLeft ? "right-6 left-auto" : "left-6"} w-12 h-[3px] rounded-b-full`}
                            style={{ background: m.accent }}
                          />

                          <div
                            className="inline-block text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3"
                            style={{ background: `${m.accent}18`, color: m.accent }}
                          >
                            {m.year}
                          </div>
                          <h3 className="text-lg font-black text-slate-900 mb-2">{m.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{m.description}</p>
                        </div>
                      </div>

                      {/* Center icon */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10"
                        style={{ background: m.accent, boxShadow: `0 0 0 4px ${m.accent}30, 0 4px 16px ${m.accent}50` }}
                      >
                        <Icon className="text-white w-5 h-5" />
                      </div>

                      {/* Spacer */}
                      <div className="w-[calc(50%-2rem)]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              DOCTOR CARDS
          ════════════════════════════════════ */}
          <section className="mt-40 mb-8">
            <div className="doctors-heading text-center mb-14">
              <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-400 block mb-4">
                Our Specialists
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                Meet Your{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Surgical Team
                </span>
              </h2>
              <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
                Board-certified surgeons with decades of combined experience and a
                commitment to excellence in every procedure.
              </p>
            </div>

            <div
              ref={doctorsRef}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              style={{ perspective: "1200px" }}
            >
              {doctors.map((doc, i) => (
                <div
                  key={i}
                  className="doctor-card group relative overflow-hidden backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl"
                  style={{ background: "rgba(255,255,255,0.46)" }}
                >
                  {/* Top shimmer */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent z-10" />
                  {/* Hover gradient bloom */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${doc.gradient} transition-opacity duration-500 rounded-[2rem]`}
                  />
                  {/* Top accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${doc.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
                  />

                  <div className="p-7">
                    {/* Avatar row */}
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-transform duration-500 group-hover:scale-105"
                        style={{ borderColor: doc.accent + "60" }}
                      >
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base leading-tight">{doc.name}</h3>
                        <span
                          className="text-xs font-semibold mt-1 inline-block"
                          style={{ color: doc.accent }}
                        >
                          {doc.specialty}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">{doc.bio}</p>

                    {/* Info pills */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { label: "Experience", val: doc.experience },
                        { label: "Surgeries", val: doc.surgeries },
                        { label: "Education", val: doc.education.split(" ")[0] },
                      ].map(({ label, val }) => (
                        <div
                          key={label}
                          className="text-center rounded-xl p-2.5 border border-white/50"
                          style={{ background: "rgba(255,255,255,0.5)" }}
                        >
                          <div className="text-xs font-black text-slate-900">{val}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Rating + CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-slate-800">{doc.rating}</span>
                        <span className="text-xs text-slate-400">/ 5.0</span>
                      </div>
                      <button
                        className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${doc.accent}, ${doc.accent}cc)`,
                          boxShadow: `0 4px 14px ${doc.accent}30`,
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════
              CTA / CONTACT SECTION
          ════════════════════════════════════ */}
          <section className="mt-36">
            <div
              className="cta-section relative backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-10 md:p-14 shadow-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.46)" }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.35em] uppercase text-cyan-600 block mb-5">
                    Get In Touch
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6">
                    Ready to Take{" "}
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      the Next Step?
                    </span>
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    Our surgical coordinators are available to walk you through
                    your options, answer your questions, and schedule a
                    consultation with the right specialist.
                  </p>

                  <div className="space-y-4">
                    {[
                      { icon: Phone, label: "+1 (800) 633-4267", sub: "Mon – Fri, 8am – 6pm" },
                      { icon: Mail,  label: "surgery@medicore.health", sub: "Response within 24h" },
                      { icon: MapPin,label: "12 MediCore Blvd, Floor 7", sub: "New York, NY 10001" },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(6,182,212,0.1)" }}
                        >
                          <Icon className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{label}</div>
                          <div className="text-xs text-slate-400">{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="relative rounded-[1.75rem] p-8 border border-white/50 shadow-inner backdrop-blur-sm overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                  <h3 className="text-xl font-black text-slate-900 mb-6">Request a Consultation</h3>

                  <div className="space-y-4">
                    {[
                      { ph: "Full Name", type: "text" },
                      { ph: "Email Address", type: "email" },
                      { ph: "Phone Number", type: "tel" },
                    ].map(({ ph, type }) => (
                      <input
                        key={ph}
                        type={type}
                        placeholder={ph}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 backdrop-blur-sm"
                      />
                    ))}

                    <select className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200">
                      <option value="">Select Specialty</option>
                      {specialties.map((s) => <option key={s}>{s}</option>)}
                    </select>

                    <textarea
                      rows={3}
                      placeholder="Brief description of your concern..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 resize-none"
                    />

                    <button
                      className="w-full py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                      style={{
                        background: "linear-gradient(135deg,#06b6d4,#6366f1)",
                        boxShadow: "0 8px 28px #06b6d440",
                      }}
                    >
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(20deg); }
          40%      { transform: rotate(-8deg); }
          60%      { transform: rotate(16deg); }
          80%      { transform: rotate(-4deg); }
        }
      `}</style>
    </>
  );
}