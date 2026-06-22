"use client";
import { useState } from "react";

const SESSIONS = [
  { id: "1", title: "Calculus I — Limits & Continuity", date: "June 28, 2025", status: "UPCOMING", enrolled: 18, zoomLink: "" },
  { id: "2", title: "Linear Algebra — Eigenvalues", date: "June 23, 2025", status: "LIVE", enrolled: 22, zoomLink: "https://zoom.us/j/123456" },
  { id: "3", title: "Calculus II — Integration", date: "June 18, 2025", status: "RECORDING", enrolled: 20, zoomLink: "" },
  { id: "4", title: "Differential Equations", date: "June 15, 2025", status: "ENDED", enrolled: 19, zoomLink: "" },
];

const STATES = ["UPCOMING", "LIVE", "ENDED", "RECORDING"];
const STATUS_COLORS = {
  UPCOMING: "bg-surface-high text-ink-muted",
  LIVE: "bg-danger-light text-danger",
  ENDED: "bg-warning-light text-[#8B6914]",
  RECORDING: "bg-secondary-light text-secondary",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState(SESSIONS);
  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState(null);

  function advance(id) {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextStatus = STATES[STATES.indexOf(s.status) + 1] || s.status;
      return { ...s, status: nextStatus };
    }));
  }

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Sessions</h1>
          <p className="text-ink-muted text-base leading-relaxed">Manage all sessions — advance lifecycle, upload recordings, set paywall.</p>
        </div>
        <button onClick={() => { setEditSession(null); setShowModal(true); }} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Add Session
        </button>
      </div>

      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-low">
              {["Title", "Date", "Status", "Enrolled", "Actions"].map(h => <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>)}
            </tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 font-headline font-bold text-sm">{s.title}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{s.date}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[s.status]}`}>{s.status}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold">{s.enrolled} students</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {STATES.indexOf(s.status) < STATES.length - 1 && (
                        <button onClick={() => advance(s.id)} className="flex items-center gap-1 px-3 py-1.5 bg-secondary-light text-secondary text-xs font-bold rounded-full hover:brightness-95 active:scale-95 transition-all">
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          Advance
                        </button>
                      )}
                      <button onClick={() => { setEditSession(s); setShowModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-danger hover:bg-danger-light transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[560px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">{editSession ? "Edit Session" : "New Session"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Title</label>
                <input type="text" defaultValue={editSession?.title} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Date</label>
                  <input type="datetime-local" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Price (USD)</label>
                  <input type="number" placeholder="0 for free" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Zoom Live Link</label>
                <input type="url" placeholder="https://zoom.us/j/..." defaultValue={editSession?.zoomLink} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
              </div>
              {editSession?.status === "ENDED" && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Zoom Recording Link</label>
                  <input type="url" placeholder="Paste Zoom cloud recording URL..." className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
                </div>
              )}
              <button onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
                {editSession ? "Save Changes" : "Create Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
