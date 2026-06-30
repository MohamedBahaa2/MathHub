"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { help as helpApi } from "@/lib/api";
import { getUser } from "@/lib/api";

const STATUS_COLORS = {
  OPEN: "bg-primary-light text-primary",
  IN_PROGRESS: "bg-secondary-light text-secondary",
  RESOLVED: "bg-surface-high text-ink-muted",
};
const STATUS_LABEL = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved" };
const PRIORITY_COLORS = {
  HIGH: "bg-danger-light text-danger",
  MEDIUM: "bg-warning-light text-[#8B6914]",
  LOW: "bg-surface-high text-ink-muted",
};

function TicketChat({ ticket, currentUserId, onTicketUpdated }) {
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [sending, setSending] = useState(false);
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
      setMessageText("");
      setMediaFile(null);
      onTicketUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const isResolved = ticket.status === "RESOLVED";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-4 px-1">
        {/* Original ticket as first message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {ticket.student?.name?.[0] || "S"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold">{ticket.student?.name || "Student"}</span>
              <span className="text-[0.6rem] text-ink-muted">{new Date(ticket.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
              <span className="text-[0.6rem] text-ink-muted">(original request)</span>
            </div>
            <div className="bg-surface-low rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed max-w-[85%]">
              {ticket.description}
            </div>
          </div>
        </div>

        {/* Chat messages */}
        {messages.map(msg => {
          const isOwn = msg.sender?.id === currentUserId;
          const isAdmin = msg.sender?.role === "SUPERADMIN" || msg.sender?.role === "ASSISTANT";
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                {msg.sender?.name?.[0] || "?"}
              </div>
              <div className={`flex-1 flex flex-col ${isOwn ? "items-end" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">{msg.sender?.name || "Unknown"}</span>
                  {isAdmin && <span className="text-[0.6rem] px-1.5 py-0.5 bg-secondary-light text-secondary rounded font-bold">Staff</span>}
                  <span className="text-[0.6rem] text-ink-muted">{new Date(msg.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                {msg.body && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${isOwn ? "bg-primary text-white rounded-tr-sm" : "bg-surface-low rounded-tl-sm"}`}>
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

        {messages.length === 0 && (
          <div className="text-center text-xs text-ink-muted py-4">No replies yet — a staff member will respond soon.</div>
        )}
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
            <textarea
              rows={2}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-2.5 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none"
            />
            <button type="submit" disabled={sending || (!messageText.trim() && !mediaFile)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white hover:brightness-110 transition-all disabled:opacity-40 shrink-0">
              {sending
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-surface-high pt-4 mt-2 text-center text-xs text-ink-muted">
          <span className="material-symbols-outlined text-sm align-middle mr-1">lock</span>
          This ticket is resolved. Open a new ticket if you need further help.
        </div>
      )}
    </div>
  );
}

export default function StudentHelpPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ topic: "", description: "", priority: "MEDIUM" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const currentUser = getUser();

  const loadTickets = useCallback(async () => {
    try {
      const data = await helpApi.list();
      const list = data.helpRequests || [];
      setTickets(list);
      // Auto-select if current selected was updated
      if (selected) {
        const updated = list.find(t => t.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { loadTickets(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true); setCreateError("");
    try {
      await helpApi.create(createForm.topic, createForm.description, createForm.priority);
      setCreateForm({ topic: "", description: "", priority: "MEDIUM" });
      setShowCreate(false);
      await loadTickets();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(ticketId) {
    if (!window.confirm("Delete this ticket? This cannot be undone.")) return;
    setDeletingId(ticketId);
    try {
      await helpApi.deleteTicket(ticketId);
      if (selected?.id === ticketId) setSelected(null);
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Ticket List */}
      <div className="w-[320px] shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="font-headline text-2xl font-extrabold">Help & Support</h1>
            <p className="text-ink-muted text-xs mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-primary hover:brightness-110 transition-all">
            + New Ticket
          </button>
        </div>

        {error && <div className="mb-3 px-3 py-2 bg-danger-light text-danger rounded-xl text-xs">{error}</div>}

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {loading ? [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl route-shimmer" />) :
            tickets.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-ink-muted">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inbox</span>
                <p className="font-semibold text-sm">No tickets yet</p>
              </div>
            ) : tickets.map(t => (
              <div key={t.id} onClick={() => setSelected(t)}
                className={`glass rounded-2xl p-4 cursor-pointer hover:shadow-elevated transition-all ${selected?.id === t.id ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold shrink-0 ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
                <p className="font-bold text-sm mb-1 line-clamp-1">{t.topic}</p>
                <p className="text-xs text-ink-muted line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.6rem] text-ink-muted">{new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.messages?.length > 0 && (
                    <span className="flex items-center gap-1 text-[0.6rem] text-secondary font-semibold">
                      <span className="material-symbols-outlined text-xs">chat</span>
                      {t.messages.length}
                    </span>
                  )}
                  {t.status === "OPEN" && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }} disabled={deletingId === t.id}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger hover:bg-danger-light transition-all ml-1">
                      {deletingId === t.id
                        ? <span className="w-3 h-3 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-sm">delete</span>}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="flex-1 glass rounded-2xl shadow-glass p-6 flex flex-col min-h-0 animate-fade-in-up">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-4 border-b border-surface-high pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${PRIORITY_COLORS[selected.priority]}`}>
                    {selected.priority}
                  </span>
                </div>
                <h2 className="font-headline font-bold text-lg">{selected.topic}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-high shrink-0">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <TicketChat ticket={selected} currentUserId={currentUser?.id} onTicketUpdated={loadTickets} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-ink-muted opacity-30 mb-4">support_agent</span>
            <p className="font-headline font-bold text-ink-muted">Select a ticket</p>
            <p className="text-sm text-ink-muted mt-1">Click on a ticket to view the conversation</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[480px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">New Help Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {createError && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{createError}</div>}
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Topic</label>
                <input required minLength={2} value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description</label>
                <textarea required minLength={10} rows={5} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue in detail…"
                  className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {[["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"]].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setCreateForm(f => ({ ...f, priority: val }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${createForm.priority === val ? "bg-primary text-white shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={creating}
                className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {creating && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {creating ? "Submitting…" : "Submit Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
