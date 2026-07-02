"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { help as helpApi } from "@/lib/api";
import { getUser } from "@/lib/api";

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

function AdminTicketChat({ ticket, currentUserId, onUpdated }) {
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messages = ticket.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() && !mediaFile) return;
    setSending(true); setError("");
    try {
      await helpApi.sendMessage(ticket.id, messageText.trim() || undefined, mediaFile || undefined);
      setMessageText(""); setMediaFile(null);
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(newStatus) {
    setUpdatingStatus(true);
    try {
      await helpApi.updateStatus(ticket.id, newStatus);
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const isResolved = ticket.status === "RESOLVED";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Student info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-surface-low rounded-xl">
        <div className="w-9 h-9 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-sm font-bold shrink-0">
          {ticket.student?.name?.[0] || "S"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{ticket.student?.name || "Student"}</p>
          <p className="text-xs text-ink-muted font-mono">{ticket.student?.studentCode || ticket.student?.email}</p>
        </div>
        {/* Status toggle */}
        <div className="flex gap-1.5">
          {["IN_PROGRESS", "RESOLVED"].map(s => (
            <button key={s} type="button" onClick={() => updateStatus(s)} disabled={updatingStatus || ticket.status === s}
              className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-all disabled:opacity-60 ${ticket.status === s ? STATUS_COLORS[s] : "bg-surface-high text-ink-muted hover:bg-surface-low"}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2 px-1">
        {/* Original request */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {ticket.student?.name?.[0] || "S"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold">{ticket.student?.name}</span>
              <span className="text-[0.6rem] text-ink-muted">{new Date(ticket.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
            <div className="bg-surface-low rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[90%]">
              {ticket.description}
            </div>
          </div>
        </div>

        {messages.map(msg => {
          const isOwn = msg.sender?.id === currentUserId;
          const isAdminMsg = msg.sender?.role === "SUPERADMIN" || msg.sender?.role === "ASSISTANT";
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdminMsg ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                {msg.sender?.name?.[0] || "?"}
              </div>
              <div className={`flex-1 flex flex-col ${isOwn ? "items-end" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">{msg.sender?.name}</span>
                  {isAdminMsg && <span className="text-[0.6rem] px-1.5 py-0.5 bg-secondary-light text-secondary rounded font-bold">Staff</span>}
                  <span className="text-[0.6rem] text-ink-muted">{new Date(msg.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                {msg.body && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[90%] ${isOwn ? "bg-secondary text-white rounded-tr-sm" : "bg-surface-low rounded-tl-sm"}`}>
                    {msg.body}
                  </div>
                )}
                {msg.mediaUrl && (
                  <a href={msg.mediaUrl} target="_blank" rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 bg-secondary-light text-secondary rounded-xl text-xs font-semibold hover:brightness-110 transition-all">
                    <span className="material-symbols-outlined text-sm">attachment</span>
                    View Attachment
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <div className="text-center text-xs text-ink-muted py-4">No messages yet.</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isResolved ? (
        <form onSubmit={sendMessage} className="border-t border-surface-high pt-4 mt-2">
          {error && <div className="mb-2 text-xs text-danger">{error}</div>}
          {mediaFile && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-surface-low rounded-xl text-xs">
              <span className="material-symbols-outlined text-sm text-secondary">attachment</span>
              <span className="flex-1 truncate">{mediaFile.name}</span>
              <button type="button" onClick={() => setMediaFile(null)} className="text-ink-muted hover:text-danger">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-low text-ink-muted hover:bg-surface-high hover:text-ink transition-colors shrink-0">
              <span className="material-symbols-outlined text-base">attach_file</span>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf,video/mp4"
              onChange={e => setMediaFile(e.target.files?.[0] || null)} />
            <textarea rows={2} value={messageText} onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Reply to student… (Enter to send)"
              className="flex-1 px-4 py-2.5 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary-light resize-none" />
            <button type="submit" disabled={sending || (!messageText.trim() && !mediaFile)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-white hover:brightness-110 transition-all disabled:opacity-40 shrink-0">
              {sending
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-surface-high pt-4 mt-2 text-center text-xs text-ink-muted">
          <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
          Ticket resolved.
        </div>
      )}
    </div>
  );
}

export default function AdminHelpPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const currentUser = getUser();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await helpApi.list();
      const list = data.helpRequests || [];
      setRequests(list);
      if (selected) {
        const updated = list.find(r => r.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      setError(err.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchRequests(); }, []);

  const filtered = filterStatus === "ALL" ? requests : requests.filter(r => r.status === filterStatus);
  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === "OPEN").length,
    IN_PROGRESS: requests.filter(r => r.status === "IN_PROGRESS").length,
    RESOLVED: requests.filter(r => r.status === "RESOLVED").length,
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Help Requests</h1>
          <p className="text-ink-muted text-base leading-relaxed">Review and respond to student support tickets.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {[["ALL", "All"], ["OPEN", "Open"], ["IN_PROGRESS", "In Progress"], ["RESOLVED", "Resolved"]].map(([key, label]) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === key ? "bg-primary text-white shadow-primary" : "glass text-ink-muted hover:bg-surface-high"}`}>
              {label} <span className="ml-1 opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {loading ? [1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-24 route-shimmer" />) :
            filtered.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-ink-muted shadow-glass">
                <span className="material-symbols-outlined text-4xl mb-3 block opacity-40">inbox</span>
                <p className="font-semibold">No requests found.</p>
              </div>
            ) : filtered.map(req => (
              <div key={req.id} onClick={() => setSelected(req)}
                className={`glass rounded-2xl p-5 shadow-glass cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all animate-fade-in-up ${selected?.id === req.id ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${PRIORITY_COLORS[req.priority]}`}>
                      {PRIORITY_LABEL[req.priority]}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted shrink-0">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-headline font-bold text-sm mb-1 truncate">{req.topic}</p>
                <p className="text-xs text-ink-muted truncate">{req.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-5 h-5 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-[0.55rem] font-bold">
                    {req.student?.name?.[0] || "S"}
                  </div>
                  <span className="text-xs text-ink-muted">{req.student?.name}</span>
                  {req.messages?.length > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-secondary font-semibold">
                      <span className="material-symbols-outlined text-xs">chat</span> {req.messages.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right: Chat panel */}
      <div className="w-[400px] shrink-0 glass rounded-2xl shadow-glass p-6 flex flex-col min-h-0">
        {selected ? (
          <>
            <div className="flex items-start gap-3 mb-4 border-b border-surface-high pb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${PRIORITY_COLORS[selected.priority]}`}>
                    {PRIORITY_LABEL[selected.priority]}
                  </span>
                </div>
                <h2 className="font-headline font-bold text-base leading-snug">{selected.topic}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-high shrink-0">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <AdminTicketChat ticket={selected} currentUserId={currentUser?.id} onUpdated={fetchRequests} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-ink-muted opacity-30 mb-4">support_agent</span>
            <p className="font-headline font-bold text-ink-muted">Select a ticket</p>
            <p className="text-sm text-ink-muted mt-1">Click on a request to reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
