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

export default function AdminHelpPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("IN_PROGRESS");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
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

  function openReply(req) {
    setSelected(req);
    setReplyText(req.adminReply || "");
    setReplyStatus(req.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS");
    setReplyError("");
    setReplySuccess(false);
  }

  async function handleReply() {
    if (!replyText.trim()) {
      setReplyError("Reply cannot be empty.");
      return;
    }
    setSubmitting(true);
    setReplyError("");
    setReplySuccess(false);
    try {
      await help.reply(selected.id, replyText.trim(), replyStatus);
      setReplySuccess(true);
      await fetchRequests();
      // Update the selected request in-place
      setSelected(prev => ({ ...prev, adminReply: replyText.trim(), status: replyStatus, repliedAt: new Date().toISOString() }));
    } catch (err) {
      setReplyError(err.message || "Failed to send reply.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filterStatus === "ALL" ? requests : requests.filter(r => r.status === filterStatus);

  const counts = {
    all: requests.length,
    open: requests.filter(r => r.status === "OPEN").length,
    inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
    resolved: requests.filter(r => r.status === "RESOLVED").length,
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Help Requests</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Review and respond to student support tickets.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { key: "ALL", label: "All", value: counts.all, color: "text-ink", bg: "bg-surface-high" },
            { key: "OPEN", label: "Open", value: counts.open, color: "text-primary", bg: "bg-primary-light" },
            { key: "IN_PROGRESS", label: "In Progress", value: counts.inProgress, color: "text-secondary", bg: "bg-secondary-light" },
            { key: "RESOLVED", label: "Resolved", value: counts.resolved, color: "text-ink-muted", bg: "bg-surface-high" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={`glass rounded-xl p-4 flex items-center gap-3 shadow-glass transition-all hover:shadow-elevated ${filterStatus === s.key ? "ring-2 ring-primary" : ""}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-headline font-extrabold ${s.bg} ${s.color}`}>{s.value}</div>
              <span className="font-semibold text-xs text-ink-muted">{s.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{error}</div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse shadow-glass" />)
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-ink-muted shadow-glass">
              <span className="material-symbols-outlined text-4xl mb-3 block opacity-40">inbox</span>
              <p className="font-semibold">No requests found.</p>
            </div>
          ) : filtered.map(req => (
            <div
              key={req.id}
              onClick={() => openReply(req)}
              className={`glass rounded-2xl p-5 shadow-glass cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all animate-fade-in-up ${selected?.id === req.id ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[req.status] || "bg-surface-high text-ink-muted"}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${PRIORITY_COLORS[req.priority] || "bg-surface-high text-ink-muted"}`}>
                    {PRIORITY_LABEL[req.priority] || req.priority}
                  </span>
                </div>
                <span className="text-xs text-ink-muted shrink-0">{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="font-headline font-bold text-sm mb-1 truncate">{req.topic}</p>
              <p className="text-xs text-ink-muted truncate">{req.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-[0.55rem] font-bold">
                  {req.student?.name?.[0] || "S"}
                </div>
                <span className="text-xs text-ink-muted">{req.student?.name || "Student"}</span>
                {req.adminReply && (
                  <span className="ml-auto text-xs text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span> Replied
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Reply */}
      <div className="w-[380px] shrink-0">
        {selected ? (
          <div className="glass rounded-2xl shadow-elevated p-6 h-full flex flex-col animate-fade-in-up overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-lg">Reply to Ticket</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Ticket Info */}
            <div className="p-4 bg-surface-low rounded-xl mb-4">
              <div className="flex gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${PRIORITY_COLORS[selected.priority]}`}>
                  {PRIORITY_LABEL[selected.priority]}
                </span>
              </div>
              <p className="font-headline font-bold text-sm mb-1">{selected.topic}</p>
              <p className="text-xs text-ink-muted mb-3 leading-relaxed">{selected.description}</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-[0.6rem] font-bold">
                  {selected.student?.name?.[0] || "S"}
                </div>
                <span className="text-xs text-ink-muted">{selected.student?.name}</span>
                <span className="text-xs text-ink-muted">·</span>
                <span className="text-xs text-ink-muted font-mono">{selected.student?.studentCode}</span>
              </div>
            </div>

            {/* Previous reply */}
            {selected.adminReply && (
              <div className="p-3 bg-secondary-xlight rounded-xl border-l-2 border-secondary mb-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">Previous Reply</p>
                <p className="text-sm text-ink leading-relaxed">{selected.adminReply}</p>
              </div>
            )}

            {/* Reply form */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Your Response</label>
                <textarea
                  rows={6}
                  placeholder="Type your reply to the student..."
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Update Status</label>
                <div className="flex gap-2">
                  {[["IN_PROGRESS", "In Progress"], ["RESOLVED", "Resolved"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReplyStatus(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${replyStatus === val ? (val === "RESOLVED" ? "bg-surface-high text-ink ring-2 ring-primary" : "bg-secondary-light text-secondary ring-2 ring-primary") : "bg-surface-low text-ink-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {replyError && (
                <div className="px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{replyError}</div>
              )}
              {replySuccess && (
                <div className="px-4 py-3 bg-secondary-xlight text-secondary rounded-xl text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Reply sent successfully!
                </div>
              )}

              <button
                type="button"
                onClick={handleReply}
                disabled={submitting}
                className="mt-auto w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {submitting ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl shadow-glass p-10 flex flex-col items-center justify-center text-center h-full">
            <span className="material-symbols-outlined text-5xl text-ink-muted opacity-30 mb-4">support_agent</span>
            <p className="font-headline font-bold text-ink-muted">Select a ticket</p>
            <p className="text-sm text-ink-muted mt-1">Click on a request to reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
