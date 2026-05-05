import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import {
  HeartPulse, User, Mail, Lock, Phone,
  CreditCard, Calendar, Users, ShieldCheck,
  Zap, Bell
} from "lucide-react";
import { gsap } from "gsap";

const features = [
  { icon: Zap,         color: "#f59e0b", title: "Real-time Updates", desc: "Live patient data across all floors." },
  { icon: ShieldCheck, color: "#34d399", title: "Secure & Compliant", desc: "Role-based access for every staff member." },
  { icon: Bell,        color: "#60a5fa", title: "Instant Alerts",    desc: "Critical notifications to the right team." },
];

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    ssn: "", phone: "", age: 0, gender: "",
  });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");
  const isMounted = useRef(true);

  // GSAP refs
  const blobTL  = useRef(null);
  const blobBL  = useRef(null);
  const blobC   = useRef(null);
  const cardRef = useRef(null);
  const featureRefs = useRef([]);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Blobs breathe
      gsap.to(blobTL.current, { scale: 1.15, x: 20, y: -15, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(blobBL.current, { scale: 1.2,  x: -15, y: 20, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
      gsap.to(blobC.current,  { scale: 1.1,  duration: 6,  repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });

      // Card slides up
      gsap.from(cardRef.current, { y: 40, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });

      // Feature cards stagger in
      gsap.from(featureRefs.current, {
        y: 24, opacity: 0, duration: 0.5, stagger: 0.12,
        ease: "power2.out", delay: 0.4,
      });
    });
    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        age: parseInt(formData.age, 10),
        gender: formData.gender.toUpperCase(),
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null; // prevent crash if response isn't JSON
    }

    if (response.ok) {
      navigate("/signin");
      return; // 🔥 stop execution
    }

    setError(data?.message || data?.err || "Signup failed");

  } catch (err) {
    setError("Network error. Please try again.");
  } finally {
    setLoading(false); // 🔥 ALWAYS runs
  }
};

  // Shared input class
  const inputCls = "w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-50 items-center justify-center px-4 py-10">

      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative blobs */}
      <div ref={blobTL} className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-100 opacity-60 blur-3xl pointer-events-none" />
      <div ref={blobBL} className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-100 opacity-50 blur-3xl pointer-events-none" />
      <div ref={blobC}  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-sky-50 opacity-60 blur-3xl pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-lg flex flex-col gap-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <HeartPulse className="text-white" size={22} />
          </div>
          <span className="text-slate-800 text-lg font-bold tracking-tight">MediCore</span>
        </div>

        {/* Form card */}
        <div
          ref={cardRef}
          className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/60 p-7"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-slate-400">Fill in your details to get access to your department</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 — Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" name="name" placeholder="Dr. John Doe" value={formData.name} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="email" name="email" placeholder="doctor@medicore.com" value={formData.email} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
            </div>

            {/* Row 2 — Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
            </div>

            {/* Row 3 — SSN + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>SSN</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" name="ssn" placeholder="XXX-XX-XXXX" value={formData.ssn} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" name="phone" placeholder="+20 1XX XXX XXXX" value={formData.phone} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
            </div>

            {/* Row 4 — Age + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Age</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="number" name="age" placeholder="30" min="18" max="80" value={formData.age || ""} onChange={handleChange} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select name="gender" value={formData.gender} onChange={handleChange} required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm shadow-blue-900/20 mt-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </>
              ) : "Create Account →"}
            </button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
            <ShieldCheck size={13} className="text-green-500" />
            Secure &amp; encrypted connection
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3">
          {features.map(({ icon: Icon, color, title, desc }, i) => (
            <div
              key={title}
              ref={(el) => (featureRefs.current[i] = el)}
              className="bg-white/70 backdrop-blur-sm border border-slate-200/70 rounded-xl p-3 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18", border: `1px solid ${color}30` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div className="text-xs font-semibold text-slate-700 leading-tight">{title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}