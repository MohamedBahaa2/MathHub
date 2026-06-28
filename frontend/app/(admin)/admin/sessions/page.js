"use client";
import { useState, useEffect, useCallback } from "react";
import { sessions as sessionsApi, courses as coursesApi } from "@/lib/api";

const STATES = ["UPCOMING", "LIVE", "ENDED", "RECORDING"];
const STATUS_COLORS = {
  UPCOMING: "bg-surface-high text-ink-muted",
  LIVE: "bg-danger-light text-danger",
  ENDED: "bg-warning-light text-[#8B6914]",
  RECORDING: "bg-secondary-light text-secondary",
};
const STATUS_NEXT = { UPCOMING: "LIVE", LIVE: "ENDED", ENDED: "RECORDING" };

function SessionModal({ session, courses, onClose, onSaved }) {
  const isEdit = !!session;
  const [form, setForm] = useState({
    title: session?.title ?? "",
    topic: session?.topic ?? "",
    description: session?.description ?? "",
    scheduledAt: session?.scheduledAt ? new Date(session.scheduledAt).toISOString().slice(0, 16) : "",
    durationMin: session?.durationMin ?? 60,
    sessionPrice: session?.sessionPrice ?? "",
    courseId: session?.courseId ?? "",
    zoomLive: "",
    zoomRecording: "",
    zoomPasscode: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = {
      title: form.title, topic: form.topic, description: form.description,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      durationMin: Number(form.durationMin),
      pricingType: form.courseId ? "COURSE" : "SESSION",
      sessionPrice: form.sessionPrice ? Number(form.sessionPrice) : undefined,
      courseId: form.courseId || undefined,
      zoomLive: form.zoomLive || undefined,
      zoomRecording: form.zoomRecording || undefined,
      zoomPasscode: form.zoomPasscode || undefined,
    };
    try {
      if (isEdit) await sessionsApi.update(session.id, payload);
      else await sessionsApi.create(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[560px] p-8 animate-fade-in-up my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-extrabold">{isEdit ? "Edit Session" : "New Session"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Title", key: "title", type: "text", required: true },
            { label: "Topic", key: "topic", type: "text", required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">{f.label}</label>
              <input required={f.required} type={f.type} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Scheduled At</label>
              <input required type="datetime-local" value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Duration (min)</label>
              <input required type="number" value={form.durationMin}
                onChange={e => setForm(p => ({ ...p, durationMin: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Session Price (USD)</label>
              <input type="number" value={form.sessionPrice}
                onChange={e => setForm(p => ({ ...p, sessionPrice: e.target.value }))}
                placeholder="e.g. 15"
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Course (Optional)</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
                <option value="">None (Standalone Session)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Zoom Live Link</label>
            <input type="url" value={form.zoomLive}
              onChange={e => setForm(p => ({ ...p, zoomLive: e.target.value }))}
              placeholder="https://zoom.us/j/..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Zoom Recording Link</label>
            <input type="url" value={form.zoomRecording}
              onChange={e => setForm(p => ({ ...p, zoomRecording: e.target.value }))}
              placeholder="Paste Zoom cloud recording URL..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Zoom Passcode</label>
            <input type="text" value={form.zoomPasscode}
              onChange={e => setForm(p => ({ ...p, zoomPasscode: e.target.value }))}
              placeholder="Optional"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Session"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminSessionsPage() {
  const [sessionsList, setSessionsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [advancing, setAdvancing] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([sessionsApi.list(), coursesApi.list()]);
      setSessionsList(sRes.sessions || []);
      setCoursesList(cRes.courses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdvance(s) {
    const nextStatus = STATUS_NEXT[s.status];
    if (!nextStatus) return;
    setAdvancing(s.id);
    try {
      await sessionsApi.advanceStatus(s.id, nextStatus);
      setSessionsList(prev => prev.map(item => item.id === s.id ? { ...item, status: nextStatus } : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setAdvancing(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    try {
      await sessionsApi.delete(id);
      setSessionsList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Sessions</h1>
          <p className="text-ink-muted text-base leading-relaxed">Manage all sessions — lifecycle, Zoom links, pricing.</p>
        </div>
        <button onClick={() => { setEditSession(null); setShowModal(true); }}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Add Session
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["Title", "Course", "Topic", "Scheduled", "Status", "Enrolled", "Price", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1,2,3,4,5,6,7].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-20" /></td>)}
                  </tr>
                ))
              ) : sessionsList.map(s => (
                <tr key={s.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 font-headline font-bold text-sm max-w-[220px]">
                    <p className="truncate">{s.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold max-w-[180px]">
                    <p className="truncate">{s.course?.name ?? "—"}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{s.topic}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">
                    {new Date(s.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[s.status] ?? "bg-surface-high text-ink-muted"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{s._count?.enrollments ?? 0}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">
                    {s.sessionPrice ? `$${s.sessionPrice}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {STATUS_NEXT[s.status] && (
                        <button
                          onClick={() => handleAdvance(s)}
                          disabled={advancing === s.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-secondary-light text-secondary text-xs font-bold rounded-full hover:brightness-95 active:scale-95 transition-all disabled:opacity-40">
                          {advancing === s.id
                            ? <span className="w-3 h-3 border border-secondary/30 border-t-secondary rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                          {advancing === s.id ? "..." : STATUS_NEXT[s.status]}
                        </button>
                      )}
                      <button onClick={() => { setEditSession(s); setShowModal(true); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-danger hover:bg-danger-light transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sessionsList.length === 0 && (
            <div className="p-10 text-center text-ink-muted">No sessions yet.</div>
          )}
        </div>
      </div>

      {showModal && (
        <SessionModal
          session={editSession}
          courses={coursesList}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </>
  );
}
