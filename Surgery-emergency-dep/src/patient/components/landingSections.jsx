import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router";
import { useNavigate } from "react-router";

gsap.registerPlugin(ScrollTrigger);

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { value: "10K+", label: "Patients Supported",   color: "from-cyan-500 to-teal-500",    glow: "#06b6d4", text: "text-cyan-700"    },
  { value: "250+", label: "Professional Doctors", color: "from-blue-500 to-indigo-500",  glow: "#3b82f6", text: "text-blue-700"    },
  { value: "98%",  label: "Patient Satisfaction", color: "from-emerald-500 to-teal-500", glow: "#10b981", text: "text-emerald-700" },
  { value: "24/7", label: "Medical Assistance",   color: "from-purple-500 to-violet-500",glow: "#8b5cf6", text: "text-purple-700"  },
];

const steps = [
  { n: 1, title: "Book",      desc: "Schedule appointments and consultations instantly.",       color: "from-cyan-500 to-teal-400",    glow: "#06b6d4" },
  { n: 2, title: "Consult",   desc: "Connect directly with healthcare professionals.",          color: "from-blue-500 to-indigo-400",  glow: "#3b82f6" },
  { n: 3, title: "Surgery",   desc: "Stay updated on procedures and surgery planning.",        color: "from-purple-500 to-violet-400",glow: "#8b5cf6" },
  { n: 4, title: "Recover",   desc: "Track medications and recovery progress.",                 color: "from-emerald-500 to-teal-400", glow: "#10b981" },
  { n: 5, title: "Follow-Up", desc: "Continue communication and post-care support.",           color: "from-rose-500 to-pink-400",    glow: "#f43f5e" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingSections() {
  const navigate = useNavigate()
  const wrapperRef  = useRef(null);
  const statsRef    = useRef(null);
  const journeyRef  = useRef(null);
  const ctaRef      = useRef(null);
  const connectorRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── STATS: heading slides up, cards fan in ──────────────────────
      gsap.fromTo(".stats-label",
        { opacity: 0, y: 20, letterSpacing: "0.5em" },
        {
          opacity: 1, y: 0, letterSpacing: "0.3em", duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: statsRef.current, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(".stats-heading",
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1, ease: "power4.out",
          scrollTrigger: { trigger: statsRef.current, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(".stats-subtext",
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.1,
          scrollTrigger: { trigger: statsRef.current, start: "top 85%", once: true },
        }
      );

      gsap.set(".stat-card", { opacity: 0, y: 60, scale: 0.88, rotateX: 12 });
      gsap.to(".stat-card", {
        opacity: 1, y: 0, scale: 1, rotateX: 0,
        duration: 0.7, stagger: 0.1, ease: "back.out(1.4)",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: ".stat-card", start: "top 88%", once: true },
      });

      // Number count-up for stat values
      document.querySelectorAll(".stat-number[data-target]").forEach((el) => {
        const raw    = el.dataset.target;       // e.g. "10K+", "98%", "24/7"
        const num    = parseFloat(raw);          // NaN for "24/7"
        const suffix = raw.replace(/[\d.]/g, ""); // "+", "%", "/7", etc.

        if (!isNaN(num)) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: num,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.val) + suffix;
            },
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        }
      });

      // ── JOURNEY: connector line draws across, then cards pop in ────
      gsap.fromTo(".journey-label",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: journeyRef.current, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(".journey-heading",
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1, ease: "power4.out",
          scrollTrigger: { trigger: journeyRef.current, start: "top 85%", once: true },
        }
      );

      // Connector line draw
      if (connectorRef.current) {
        gsap.fromTo(connectorRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1, duration: 1.4, ease: "power2.inOut",
            scrollTrigger: { trigger: journeyRef.current, start: "top 75%", once: true },
          }
        );
      }

      // Step cards cascade with alternating Y direction
      gsap.set(".step-card", { opacity: 0, y: 70, scale: 0.9 });
      gsap.to(".step-card", {
        opacity: 1, y: 0, scale: 1,
        duration: 0.65,
        stagger: { amount: 0.6, from: "start" },
        ease: "back.out(1.3)",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: journeyRef.current, start: "top 75%", once: true },
      });

      // Step number badges spin in
      gsap.set(".step-badge", { scale: 0, rotation: -45 });
      gsap.to(".step-badge", {
        scale: 1, rotation: 0,
        duration: 0.5,
        stagger: { amount: 0.5, from: "start" },
        ease: "back.out(2)",
        delay: 0.3,
        scrollTrigger: { trigger: journeyRef.current, start: "top 75%", once: true },
      });

      // ── CTA: glow blob pulses in, card rises ───────────────────────
      gsap.fromTo(".cta-blob",
        { opacity: 0, scale: 0.6 },
        {
          opacity: 1, scale: 1, duration: 1.4, ease: "power3.out",
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".cta-card",
        { opacity: 0, y: 80, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power4.out",
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".cta-label",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.2,
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".cta-heading",
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1, ease: "power4.out", delay: 0.3,
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".cta-body",
        { opacity: 0, y: 25 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.45,
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );
      gsap.fromTo(".cta-btn",
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6, stagger: 0.1, ease: "back.out(1.6)", delay: 0.55,
          scrollTrigger: { trigger: ctaRef.current, start: "top 80%", once: true },
        }
      );

      // Floating pulse on CTA blob (infinite)
      gsap.to(".cta-blob", {
        scale: 1.06, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1,
      });

      ScrollTrigger.refresh();
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef}>

      {/* ══════════════════════════════════════════
          TRUSTED STATS
      ══════════════════════════════════════════ */}
      <section ref={statsRef} className="mt-28 relative">
        <div className="text-center mb-14">
          <span className="stats-label block text-cyan-700 font-semibold uppercase tracking-[0.3em] text-sm">
            Trusted Worldwide
          </span>
          <h2 className="stats-heading text-5xl font-bold text-slate-900 mt-4">
            Healthcare Backed By Results
          </h2>
          <p className="stats-subtext text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
            MediCore continues to help thousands of patients connect
            with doctors and manage healthcare seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" style={{ perspective: "1000px" }}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="stat-card group relative overflow-hidden backdrop-blur-2xl bg-white/40 border border-white/30 rounded-[2rem] p-8 text-center shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default"
              style={{ boxShadow: `0 4px 30px ${s.glow}15` }}
            >
              {/* Top shimmer */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              {/* Hover bloom */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${s.color} transition-opacity duration-500 rounded-[2rem]`} />
              {/* Glow orb */}
              <div
                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                style={{ background: s.glow }}
              />

              <h3
                className={`stat-number text-5xl font-bold ${s.text} relative z-10`}
                data-target={s.value}
              >
                {s.value}
              </h3>
              <p className="text-slate-700 mt-3 relative z-10 font-medium">{s.label}</p>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r ${s.color} rounded-t-full opacity-0 group-hover:opacity-70 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PATIENT JOURNEY
      ══════════════════════════════════════════ */}
      <section ref={journeyRef} className="mt-32 relative">
        <div className="text-center mb-16">
          <span className="journey-label block text-cyan-700 font-semibold uppercase tracking-[0.3em] text-sm">
            Patient Journey
          </span>
          <h2 className="journey-heading text-5xl font-bold text-slate-900 mt-4">
            Your Healthcare Experience
          </h2>
        </div>

        {/* Animated connector line (hidden on mobile) */}
        <div className="hidden xl:block relative mb-[-1rem] px-16 z-0">
          <div
            ref={connectorRef}
            className="h-[2px] w-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #10b981, #f43f5e)",
              boxShadow: "0 0 12px rgba(99,102,241,0.35)",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="step-card group relative overflow-hidden backdrop-blur-2xl bg-white/40 border border-white/30 rounded-[2rem] p-6 shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default"
              style={{ boxShadow: `0 4px 28px ${s.glow}18` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${s.color} transition-opacity duration-500 rounded-[2rem]`} />
              <div
                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-500"
                style={{ background: s.glow }}
              />

              {/* Step number badge */}
              <div
                className={`step-badge w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center text-2xl font-bold shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                style={{ boxShadow: `0 6px 18px ${s.glow}45` }}
              >
                {s.n}
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mt-6 relative z-10">{s.title}</h3>
              <p className="text-slate-600 mt-3 relative z-10 leading-relaxed">{s.desc}</p>

              {/* Bottom accent */}
              <div className={`absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r ${s.color} rounded-t-full opacity-0 group-hover:opacity-70 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section ref={ctaRef} className="mt-32 mb-20 relative overflow-hidden">
        {/* Animated glow blob */}
        <div
          className="cta-blob absolute inset-0 rounded-[3rem]"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.22), rgba(99,102,241,0.22), rgba(168,85,247,0.22))",
            filter: "blur(40px)",
          }}
        />

        <div className="cta-card relative z-10 backdrop-blur-2xl bg-white/40 border border-white/30 rounded-[3rem] p-12 shadow-2xl text-center overflow-hidden">
          {/* Inner shimmer */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
          {/* Corner decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-violet-400/20 to-pink-400/10 blur-2xl pointer-events-none" />

          <span className="cta-label block text-cyan-700 font-semibold uppercase tracking-[0.3em] text-sm">
            The Future Of Healthcare
          </span>

          <h2 className="cta-heading text-6xl font-bold text-slate-900 mt-6 leading-tight">
            Healthcare Designed{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
              Around You
            </span>
          </h2>

          <p className="cta-body text-slate-700 text-xl mt-6 max-w-3xl mx-auto leading-relaxed">
            MediCore combines modern technology, communication,
            and patient-centered care into one seamless experience.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-10">
            <Link
              to="/patient/appointments"
              className="cta-btn px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300"
              style={{ boxShadow: "0 8px 24px rgba(6,182,212,0.35)" }}
            >
              Get Started
            </Link>
            <button onClick={
              ()=>{
                navigate("/")
              }
            } className="cta-btn px-8 py-4 rounded-2xl border border-slate-300 text-slate-800 font-semibold backdrop-blur-xl hover:bg-white/60 hover:scale-105 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}