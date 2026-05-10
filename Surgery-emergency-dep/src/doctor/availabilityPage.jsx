// DoctorAvailability.jsx

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { doctorAPI } from "../auth/api";

gsap.registerPlugin(ScrollTrigger);

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_TO_INT = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const INT_TO_DAY = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const createDefaultSchedule = () =>
  DAYS.map((day) => ({
    day,
    enabled: false,
    slots: [
      {
        start: "09:00",
        end: "17:00",
      },
    ],
  }));

function SlotCard({
  slot,
  onChange,
  onRemove,
  removable,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/40 p-4 backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,0.45)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2 block">
            Start Time
          </label>

          <input
            type="time"
            value={slot.start}
            onChange={(e) =>
              onChange("start", e.target.value)
            }
            className="w-full rounded-xl border border-violet-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="pt-7">
          <Clock3
            size={18}
            className="text-violet-400"
          />
        </div>

        <div className="flex-1">
          <label className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2 block">
            End Time
          </label>

          <input
            type="time"
            value={slot.end}
            onChange={(e) =>
              onChange("end", e.target.value)
            }
            className="w-full rounded-xl border border-violet-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-fuchsia-400"
          />
        </div>

        {removable && (
          <button
            onClick={onRemove}
            className="mt-7 w-11 h-11 rounded-xl border border-red-200 text-red-500 flex items-center justify-center hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 hover:text-white transition-all duration-500"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function DayCard({
  item,
  onToggle,
  onSlotChange,
  onAddSlot,
  onRemoveSlot,
}) {
  return (
    <div className="availability-card relative group">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-white/40 p-7 backdrop-blur-2xl shadow-2xl transition-all duration-700 hover:-translate-y-2"
        style={{
          background: "rgba(255,255,255,0.48)",
        }}
      >
        {/* glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br from-violet-500 to-fuchsia-500" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* header */}
        <div className="relative z-10 flex items-center justify-between mb-7">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl">
              <CalendarDays
                className="text-white"
                size={22}
              />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {item.day}
              </h2>

              <p className="text-sm text-slate-500 font-medium">
                Configure working hours
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className={`relative w-16 h-9 rounded-full transition-all duration-500 ${
              item.enabled
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                : "bg-slate-200"
            }`}
          >
            <div
              className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg transition-all duration-500 ${
                item.enabled
                  ? "left-8"
                  : "left-1"
              }`}
            />
          </button>
        </div>

        {/* slots */}
        {item.enabled ? (
          <div className="relative z-10 space-y-4">
            {item.slots.map((slot, idx) => (
              <SlotCard
                key={idx}
                slot={slot}
                removable={item.slots.length > 1}
                onRemove={() =>
                  onRemoveSlot(item.day, idx)
                }
                onChange={(field, value) =>
                  onSlotChange(
                    item.day,
                    idx,
                    field,
                    value
                  )
                }
              />
            ))}

            <button
              onClick={() => onAddSlot(item.day)}
              className="group/add relative overflow-hidden rounded-2xl border border-dashed border-violet-300 px-5 py-4 text-sm font-bold text-violet-600 hover:text-white transition-all duration-500"
            >
              <div className="absolute inset-0 opacity-0 group-hover/add:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-violet-500 to-fuchsia-500" />

              <span className="relative flex items-center justify-center gap-2">
                <Plus size={16} />
                Add Time Slot
              </span>
            </button>
          </div>
        ) : (
          <div className="relative z-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center">
            <p className="text-sm font-semibold text-slate-400">
              Doctor unavailable on {item.day}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorAvailability() {
  const wrapperRef = useRef(null);
  const heroRef = useRef(null);
const [schedule, setSchedule] =
  useState(createDefaultSchedule());

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Example doctor id
  // Replace with auth user id if available
  const doctorId = localStorage.getItem(
    "doctor_id"
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      })
        .fromTo(
          ".hero-badge",
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          }
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
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
          },
          "-=0.7"
        );

      gsap.fromTo(
        ".availability-card",
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
            trigger: ".availability-card",
            start: "top 85%",
          },
        }
      );

      gsap.to(heroRef.current, {
        y: -80,
        opacity: 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
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
  }, []);
  useEffect(() => {
  const loadAvailability = async () => {
    try {
      const res = await doctorAPI.getAvailability(
        doctorId
      );

      const backendData = res.data || [];

      const grouped = {};

      backendData.forEach((item) => {
        const dayName =
          INT_TO_DAY[item.dayOfWeek];

        if (!grouped[dayName]) {
          grouped[dayName] = [];
        }

        grouped[dayName].push({
          start: item.startTime,
          end: item.endTime,
        });
      });

      const formatted = DAYS.map((day) => ({
        day,
        enabled: !!grouped[day],
        slots:
          grouped[day] || [
            {
              start: "09:00",
              end: "17:00",
            },
          ],
      }));

      setSchedule(formatted);
    } catch (err) {
      console.error(
        "Failed to load availability",
        err
      );
    }
  };

  if (doctorId) {
    loadAvailability();
  }
}, [doctorId]);

  const activeDays = useMemo(
    () =>
      schedule.filter((d) => d.enabled).length,
    [schedule]
  );

  const handleToggleDay = (day) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              enabled: !d.enabled,
            }
          : d
      )
    );
  };

  const handleSlotChange = (
    day,
    index,
    field,
    value
  ) => {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;

        const updatedSlots = [...d.slots];

        updatedSlots[index] = {
          ...updatedSlots[index],
          [field]: value,
        };

        return {
          ...d,
          slots: updatedSlots,
        };
      })
    );
  };

  const handleAddSlot = (day) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              slots: [
                ...d.slots,
                {
                  start: "09:00",
                  end: "17:00",
                },
              ],
            }
          : d
      )
    );
  };

  const handleRemoveSlot = (day, index) => {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;

        return {
          ...d,
          slots: d.slots.filter(
            (_, idx) => idx !== index
          ),
        };
      })
    );
  };

const handleSave = async () => {
  try {
    setSaving(true);

    const payload = schedule
      .filter((d) => d.enabled)
      .flatMap((d) =>
        d.slots.map((slot) => ({
          dayOfWeek: DAY_TO_INT[d.day],
          startTime: slot.start,
          endTime: slot.end,
          slotDuration: 30,
          isActive: true,
        }))
      );

    await doctorAPI.setAvailability(
      doctorId,
      payload
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};

  return (
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
          className="min-h-[60vh] flex items-center pt-16"
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
                background:
                  "rgba(255,255,255,0.48)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-400/10 blur-3xl" />

              <span className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 text-violet-700 border border-violet-300/40 text-sm font-semibold mb-8">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                Weekly Availability
              </span>

              <h1 className="hero-title text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-slate-900 mb-6">
                Configure Your{" "}
                <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Schedule
                </span>
              </h1>

              <p className="hero-body text-slate-600 text-xl md:text-2xl max-w-3xl leading-relaxed">
                Manage consultation hours,
                optimize patient flow, and
                maintain a cinematic weekly
                availability system.
              </p>
            </div>
          </div>
        </section>

        {/* stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          <div
            className="relative overflow-hidden rounded-[2rem] border border-white/40 p-7 backdrop-blur-2xl shadow-xl"
            style={{
              background: "rgba(255,255,255,0.46)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">
              Active Days
            </p>

            <h2 className="text-5xl font-black bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              {activeDays}
            </h2>
          </div>

          <div
            className="relative overflow-hidden rounded-[2rem] border border-white/40 p-7 backdrop-blur-2xl shadow-xl"
            style={{
              background: "rgba(255,255,255,0.46)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">
              Total Slots
            </p>

            <h2 className="text-5xl font-black bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {schedule.reduce(
                (acc, d) =>
                  d.enabled
                    ? acc + d.slots.length
                    : acc,
                0
              )}
            </h2>
          </div>

          <div
            className="relative overflow-hidden rounded-[2rem] border border-white/40 p-7 backdrop-blur-2xl shadow-xl"
            style={{
              background: "rgba(255,255,255,0.46)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">
              Status
            </p>

            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />

              <h2 className="text-2xl font-black text-emerald-600">
                Available
              </h2>
            </div>
          </div>
        </section>

        {/* cards */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {schedule.map((item) => (
            <DayCard
              key={item.day}
              item={item}
              onToggle={() =>
                handleToggleDay(item.day)
              }
              onSlotChange={handleSlotChange}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
            />
          ))}
        </section>

        {/* save button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="group relative overflow-hidden rounded-3xl px-8 py-5 text-white font-black shadow-2xl transition-all duration-500 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg,#8b5cf6,#d946ef)",
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/10" />

            <span className="relative flex items-center gap-3">
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={18} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Availability
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}