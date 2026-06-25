"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { sessions as sessionsApi } from "@/lib/api";

const STATUS_CONFIG = {
  UPCOMING: { label: "Upcoming",  color: "bg-surface-high text-ink-muted",       dot: "bg-ink-muted" },
  LIVE:     { label: "Live Now",  color: "bg-danger-light text-danger",           dot: "bg-danger" },
  ENDED:    { label: "Ended",     color: "bg-warning-light text-[#8B6914]",       dot: "bg-warning" },
  RECORDING:{ label: "Recording", color: "bg-secondary-light text-secondary",     dot: "bg-secondary" },
};
const FILTERS = ["All", "Live", "Recordings", "Upcoming"];

function SessionCard({ session, onJoin }) {
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.UPCOMING;
  const price = session.sessionPrice ?? session.course?.sessionPrice ?? 0;

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up flex flex-col">
      <div className="relative h-[160px] bg-gradient-to-br from-ink to-[#2D2D2D] flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-white/20">play_circle</span>
        <span className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${session.status === "LIVE" ? "animate-pulse" : ""}`} />
          {cfg.label}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted mb-1">{session.topic}</span>
        <h3 className="font-headline font-bold text-base leading-snug mb-3">{session.title}</h3>
        <div className="flex items-center gap-4 text-xs text-ink-muted mb-4">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {new Date(session.scheduledAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {session.durationMin} min
          </span>
        </div>
        <div className="mt-auto">
          {session.status === "LIVE" && (
            <button onClick={() => onJoin(session.id, "live")} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-danger to-[#C62828] text-white font-headline font-bold rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">live_tv</span> Join Live Session
            </button>
          )}
          {session.status === "RECORDING" && (
            <button onClick={() => onJoin(session.id, "recording")} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">play_circle</span> Watch Recording
            </button>
          )}
          {session.status === "UPCOMING" && (
            <div className="w-full py-3 bg-surface-high text-ink-muted font-headline font-bold rounded-xl text-center text-sm">
              Starts {new Date(session.scheduledAt).toLocaleString()}
            </div>
          )}
          {session.status === "ENDED" && (
            <div className="w-full py-3 bg-warning-light text-[#8B6914] font-headline font-bold rounded-xl text-center text-sm">
              Recording coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [zoomModal, setZoomModal] = useState(null);
  const [zoomLoading, setZoomLoading] = useState(false);

  useEffect(() => {
    sessionsApi.list()
      .then(d => setAllSessions(d.sessions || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(sessionId, type) {
    setZoomLoading(true);
    try {
      const data = type === "live"
        ? await sessionsApi.getZoomLink(sessionId)
        : await sessionsApi.getRecordingUrl(sessionId);
      setZoomModal({ type, url: data.zoomUrl ?? data.recordingUrl, passcode: data.passcode });
    } catch (err) {
      setError(err.message);
    } finally {
      setZoomLoading(false);
    }
  }

  const filtered = allSessions.filter(s => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Live") return s.status === "LIVE";
    if (activeFilter === "Recordings") return s.status === "RECORDING";
    if (activeFilter === "Upcoming") return s.status === "UPCOMING";
    return true;
  });

  const hasLive = allSessions.some(s => s.status === "LIVE");

  return (
    <>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Sessions</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Your enrolled sessions. Join live or revisit recordings anytime.
        </p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === f ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
            {f}
            {f === "Live" && hasLive && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-64 animate-pulse shadow-glass" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="col-span-3 text-center py-20 text-ink-muted">
          <span className="material-symbols-outlined text-5xl mb-4 block">video_library</span>
          <p className="font-headline font-bold text-lg">
            {allSessions.length === 0 ? "No sessions enrolled yet" : "No sessions match this filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
          {filtered.map(s => <SessionCard key={s.id} session={s} onJoin={handleJoin} />)}
        </div>
      )}

      {/* Zoom Link Modal */}
      {zoomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[440px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">
                {zoomModal.type === "live" ? "🔴 Live Session" : "🎬 Recording"}
              </h2>
              <button onClick={() => setZoomModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {zoomModal.passcode && (
              <div className="mb-4 p-3 bg-warning-light rounded-xl text-sm">
                <span className="font-bold text-[#8B6914]">Passcode: </span>
                <span className="font-mono font-bold">{zoomModal.passcode}</span>
              </div>
            )}
            <a href={zoomModal.url} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
              <span className="material-symbols-outlined">{zoomModal.type === "live" ? "video_call" : "play_circle"}</span>
              {zoomModal.type === "live" ? "Open in Zoom" : "Watch Recording"}
            </a>
          </div>
        </div>
      )}
      {zoomLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 shadow-elevated flex items-center gap-4">
            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-semibold">Loading link...</span>
          </div>
        </div>
      )}
    </>
  );
}
