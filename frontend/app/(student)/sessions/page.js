"use client";

import { useState } from "react";
import Link from "next/link";

// Pricing types:
//  - { type: "session", price: N }          — buy this single session
//  - { type: "course", course: "X", sessionPrice: N, coursePrice: N }  — buy session or whole course
const MOCK_SESSIONS = [
  {
    id: "1",
    title: "Calculus I — Limits & Continuity",
    topic: "Calculus",
    date: "June 28, 2025",
    time: "6:00 PM",
    duration: "90 min",
    status: "UPCOMING",
    enrolled: true,
    pricing: { type: "course", course: "Calculus I", sessionPrice: 12, coursePrice: 45 },
  },
  {
    id: "2",
    title: "Linear Algebra — Eigenvalues",
    topic: "Linear Algebra",
    date: "June 23, 2025",
    time: "5:00 PM",
    duration: "75 min",
    status: "LIVE",
    enrolled: true,
    pricing: { type: "session", price: 15 },
  },
  {
    id: "3",
    title: "Calculus II — Integration Techniques",
    topic: "Calculus",
    date: "June 18, 2025",
    time: "6:00 PM",
    duration: "80 min",
    status: "RECORDING",
    enrolled: true,
    pricing: { type: "course", course: "Calculus I", sessionPrice: 12, coursePrice: 45 },
  },
  {
    id: "4",
    title: "Differential Equations — Separable",
    topic: "Diff. Equations",
    date: "June 15, 2025",
    time: "5:00 PM",
    duration: "90 min",
    status: "RECORDING",
    enrolled: true,
    pricing: { type: "session", price: 18 },
  },
  {
    id: "5",
    title: "Statistics — Probability Distributions",
    topic: "Statistics",
    date: "July 5, 2025",
    time: "6:00 PM",
    duration: "60 min",
    status: "UPCOMING",
    enrolled: false,
    pricing: { type: "course", course: "Statistics Fundamentals", sessionPrice: 10, coursePrice: 35 },
  },
  {
    id: "6",
    title: "Linear Algebra — Matrix Operations",
    topic: "Linear Algebra",
    date: "June 20, 2025",
    time: "5:00 PM",
    duration: "85 min",
    status: "ENDED",
    enrolled: true,
    pricing: { type: "session", price: 15 },
  },
];

const STATUS_CONFIG = {
  UPCOMING: { label: "Upcoming",   color: "bg-surface-high text-ink-muted",       dot: "bg-ink-muted" },
  LIVE:     { label: "Live Now",   color: "bg-danger-light text-danger",           dot: "bg-danger" },
  ENDED:    { label: "Processing", color: "bg-warning-light text-[#8B6914]",       dot: "bg-warning" },
  RECORDING:{ label: "Recording",  color: "bg-secondary-light text-secondary",     dot: "bg-secondary" },
};

const FILTERS = ["All", "Live", "Recordings", "Upcoming"];

function PricingBadge({ pricing }) {
  if (pricing.type === "session") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full">
        <span className="material-symbols-outlined text-sm">payments</span>
        ${pricing.price} / session
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary bg-secondary-light px-2.5 py-1 rounded-full">
      <span className="material-symbols-outlined text-sm">school</span>
      {pricing.course}
    </span>
  );
}

function BuyModal({ session, onClose }) {
  const { pricing } = session;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[440px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-extrabold">Get Access</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-sm text-ink-muted mb-6 leading-relaxed">{session.title}</p>

        <div className="flex flex-col gap-3">
          {/* Per-session option — always available */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-primary bg-primary-xlight hover:bg-primary-light active:scale-95 transition-all"
          >
            <div className="text-left">
              <p className="font-headline font-bold text-primary">This Session Only</p>
              <p className="text-xs text-ink-muted mt-0.5">One-time access to this session &amp; its recording</p>
            </div>
            <span className="font-headline text-2xl font-extrabold text-primary">
              ${pricing.type === "session" ? pricing.price : pricing.sessionPrice}
            </span>
          </button>

          {/* Per-course option — only if session belongs to a course */}
          {pricing.type === "course" && (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-secondary bg-secondary-xlight hover:bg-secondary-light active:scale-95 transition-all"
            >
              <div className="text-left">
                <p className="font-headline font-bold text-secondary">Full Course — {pricing.course}</p>
                <p className="text-xs text-ink-muted mt-0.5">Access all sessions in this course</p>
                <span className="text-[0.625rem] font-bold text-secondary uppercase tracking-wide">Best value</span>
              </div>
              <span className="font-headline text-2xl font-extrabold text-secondary">
                ${pricing.coursePrice}
              </span>
            </button>
          )}
        </div>

        <p className="text-[0.6875rem] text-ink-muted text-center mt-4">
          Payments processed securely via <strong>PayTabs</strong>
        </p>
      </div>
    </div>
  );
}

function SessionCard({ session, onBuy }) {
  const cfg = STATUS_CONFIG[session.status];
  return (
    <div className="glass rounded-2xl overflow-hidden shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-[160px] bg-gradient-to-br from-ink to-[#2D2D2D] flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-white/20">play_circle</span>
        <span className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${session.status === "LIVE" ? "animate-pulse-live" : ""}`} />
          {cfg.label}
        </span>
        {!session.enrolled && (
          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-white/80">lock</span>
            <span className="text-xs text-white/70 font-semibold">Purchase to unlock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted">{session.topic}</span>
          <PricingBadge pricing={session.pricing} />
        </div>
        <h3 className="font-headline font-bold text-base leading-snug mb-3">{session.title}</h3>
        <div className="flex items-center gap-4 text-xs text-ink-muted mb-4">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span>{session.date}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{session.duration}</span>
        </div>

        <div className="mt-auto">
          {session.status === "LIVE" && session.enrolled && (
            <Link href={`/sessions/${session.id}`} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-danger to-[#C62828] text-white font-headline font-bold rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">live_tv</span> Join Live Session
            </Link>
          )}
          {session.status === "RECORDING" && session.enrolled && (
            <Link href={`/sessions/${session.id}`} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">play_circle</span> Watch Recording
            </Link>
          )}
          {session.status === "UPCOMING" && session.enrolled && (
            <div className="w-full py-3 bg-surface-high text-ink-muted font-headline font-bold rounded-xl text-center text-sm">
              Starts {session.date} · {session.time}
            </div>
          )}
          {session.status === "ENDED" && session.enrolled && (
            <div className="w-full py-3 bg-warning-light text-[#8B6914] font-headline font-bold rounded-xl text-center text-sm">
              Recording coming soon...
            </div>
          )}
          {!session.enrolled && (
            <button
              onClick={() => onBuy(session)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">payments</span>
              Buy Access — from ${session.pricing.type === "session" ? session.pricing.price : session.pricing.sessionPrice}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [buyTarget, setBuyTarget] = useState(null);

  const filtered = MOCK_SESSIONS.filter((s) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Live") return s.status === "LIVE";
    if (activeFilter === "Recordings") return s.status === "RECORDING";
    if (activeFilter === "Upcoming") return s.status === "UPCOMING";
    return true;
  });

  return (
    <>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Sessions</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Buy individual sessions or full courses. Join live or revisit recordings anytime.
        </p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeFilter === f ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"
            }`}
          >
            {f}
            {f === "Live" && MOCK_SESSIONS.some(s => s.status === "LIVE") && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse-live" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
        {filtered.map((s) => <SessionCard key={s.id} session={s} onBuy={setBuyTarget} />)}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20 text-ink-muted">
            <span className="material-symbols-outlined text-5xl mb-4 block">video_library</span>
            <p className="font-headline font-bold text-lg">No sessions here yet</p>
          </div>
        )}
      </div>

      {buyTarget && <BuyModal session={buyTarget} onClose={() => setBuyTarget(null)} />}
    </>
  );
}
