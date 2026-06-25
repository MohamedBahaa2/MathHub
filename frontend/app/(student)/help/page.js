"use client";

import { useState, useEffect, useCallback } from "react";
import { help } from "@/lib/api";

const STATUS_COLORS = {
  OPEN: "bg-primary-light text-primary",
  IN_PROGRESS: "bg-secondary-light text-secondary",
  RESOLVED: "bg-surface-high text-ink-muted",
};

const PRIORITY_COLORS = {
  HIGH: "bg-danger-light text-danger",
  MEDIUM: "bg-warning-light text-[#8B6914]",
  LOW: "bg-surface-high text-ink-muted",
};

const STATUS_LABEL = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };
const PRIORITY_LABEL = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

export default function HelpPage() {
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ topic: "", description: "", priority: "MEDIUM" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const data = await help.list();
      setRequests(data.helpRequests || []);
    } catch (err) {
      setError(err.message || "Failed to load help requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleSubmit() {
    setFormError("");
    if (!form.topic.trim() || form.topic.trim().length < 2) {
      setFormError("Topic must be at least 2 characters.");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setFormError("Description must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await help.create(form.topic.trim(), form.description.trim(), form.priority);
      setForm({ topic: "", description: "", priority: "MEDIUM" });
      setShowForm(false);
      await fetchRequests();
    } catch (err) {
      setFormError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const counts = {
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Help &amp; Requests</h1>
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
          { label: "Open", value: counts.open, color: "text-primary", bg: "bg-primary-light" },
          { label: "In Progress", value: counts.inProgress, color: "text-secondary", bg: "bg-secondary-light" },
          { label: "Resolved", value: counts.resolved, color: "text-ink-muted", bg: "bg-surface-high" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5 shadow-glass flex items-center gap-4 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-extrabold text-lg ${s.bg} ${s.color}`}>{s.value}</div>
            <span className="font-semibold text-sm text-ink-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl shadow-glass h-[68px] animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-ink-muted shadow-glass">
          <span className="material-symbols-outlined text-4xl mb-3 block opacity-40">help_outline</span>
          <p className="font-semibold">No help requests yet.</p>
          <p className="text-sm mt-1">Click &quot;+ New Request&quot; to submit your first request.</p>
        </div>
      ) : (
        /* Request List */
        <div className="flex flex-col gap-4">
          {requests.map(req => (
            <div key={req.id} className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/30 transition-colors"
                onClick={() => setExpanded(expanded === req.id ? null : req.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold shrink-0 ${STATUS_COLORS[req.status] || "bg-surface-high text-ink-muted"}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold shrink-0 ${PRIORITY_COLORS[req.priority] || "bg-surface-high text-ink-muted"}`}>
                    {PRIORITY_LABEL[req.priority] || req.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline font-bold text-sm truncate">{req.topic}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-ink-muted shrink-0">
                  {expanded === req.id ? "expand_less" : "expand_more"}
                </span>
              </div>
              {expanded === req.id && (
                <div className="border-t border-surface-high px-5 pb-5 pt-4">
                  <p className="text-sm text-ink leading-relaxed mb-4">{req.description}</p>
                  {req.adminReply ? (
                    <div className="p-4 bg-secondary-xlight rounded-xl border-l-2 border-secondary">
                      <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">Teacher Response</p>
                      <p className="text-sm text-ink leading-relaxed">{req.adminReply}</p>
                      {req.repliedAt && (
                        <p className="text-xs text-ink-muted mt-2">{new Date(req.repliedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-low rounded-xl text-sm text-ink-muted italic">
                      Awaiting teacher response...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">New Help Request</h2>
              <button onClick={() => { setShowForm(false); setFormError(""); }} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{formError}</div>
            )}

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
                  placeholder="Describe what you need help with... (min 10 characters)"
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Priority</label>
                <div className="flex gap-3">
                  {[["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: val }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${form.priority === val ? (PRIORITY_COLORS[val] + " ring-2 ring-offset-1 ring-primary") : "bg-surface-low text-ink-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
