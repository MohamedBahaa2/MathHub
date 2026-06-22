"use client";

import { useState } from "react";

const MOCK_REQUESTS = [
  { id: 1, topic: "Calculus II — Integration Techniques", description: "I'm confused about the trigonometric substitution step at 28:45 in the recording.", priority: "High", status: "In Progress", created: "June 20, 2025", response: "Great question! For that step, we use t = sin(x) because..." },
  { id: 2, topic: "Linear Algebra — Eigenvalues", description: "Could we have an extra practice session on diagonalization?", priority: "Medium", status: "Open", created: "June 22, 2025", response: null },
  { id: 3, topic: "Statistics", description: "I need help understanding normal distribution tables.", priority: "Low", status: "Resolved", created: "June 10, 2025", response: "Please check the attached resource I uploaded. Let me know if you need more help." },
];

const STATUS_COLORS = {
  "Open": "bg-primary-light text-primary",
  "In Progress": "bg-secondary-light text-secondary",
  "Resolved": "bg-surface-high text-ink-muted",
};

const PRIORITY_COLORS = {
  "High": "bg-danger-light text-danger",
  "Medium": "bg-warning-light text-[#8B6914]",
  "Low": "bg-surface-high text-ink-muted",
};

export default function HelpPage() {
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ topic: "", description: "", priority: "Medium" });

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Help & Requests</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
            Ask the teacher for help, request extra sessions, or flag anything that needs attention.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all shrink-0"
        >
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger">
        {[
          { label: "Open", value: MOCK_REQUESTS.filter(r => r.status === "Open").length, color: "text-primary", bg: "bg-primary-light" },
          { label: "In Progress", value: MOCK_REQUESTS.filter(r => r.status === "In Progress").length, color: "text-secondary", bg: "bg-secondary-light" },
          { label: "Resolved", value: MOCK_REQUESTS.filter(r => r.status === "Resolved").length, color: "text-ink-muted", bg: "bg-surface-high" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 shadow-glass flex items-center gap-4 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-extrabold text-lg ${s.bg} ${s.color}`}>{s.value}</div>
            <span className="font-semibold text-sm text-ink-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Request List */}
      <div className="flex flex-col gap-4">
        {MOCK_REQUESTS.map((req) => (
          <div key={req.id} className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold shrink-0 ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold shrink-0 ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
                <div className="min-w-0">
                  <p className="font-headline font-bold text-sm truncate">{req.topic}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{req.created}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-ink-muted shrink-0">
                {expanded === req.id ? "expand_less" : "expand_more"}
              </span>
            </div>
            {expanded === req.id && (
              <div className="border-t border-surface-high px-5 pb-5 pt-4">
                <p className="text-sm text-ink leading-relaxed mb-4">{req.description}</p>
                {req.response && (
                  <div className="p-4 bg-secondary-xlight rounded-xl border-l-2 border-secondary">
                    <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">Teacher Response</p>
                    <p className="text-sm text-ink leading-relaxed">{req.response}</p>
                  </div>
                )}
                {!req.response && (
                  <div className="p-4 bg-surface-low rounded-xl text-sm text-ink-muted italic">
                    Awaiting teacher response...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">New Help Request</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Topic / Session</label>
                <input
                  type="text"
                  placeholder="e.g. Calculus II — Integration"
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe what you need help with..."
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Priority</label>
                <div className="flex gap-3">
                  {["Low", "Medium", "High"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${form.priority === p ? PRIORITY_COLORS[p] + " ring-2 ring-offset-1 ring-primary" : "bg-surface-low text-ink-muted"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="mt-2 w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
