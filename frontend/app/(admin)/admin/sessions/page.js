"use client";
import { useState, useEffect, useCallback } from "react";
import { sessions as sessionsApi, courses as coursesApi } from "@/lib/api";

const STATUS_COLORS = {
  SCHEDULED: "bg-surface-high text-ink-muted",
  LIVE: "bg-danger-light text-danger",
  PROCESSING: "bg-warning-light text-[#8B6914]",
  RECORDED: "bg-secondary-light text-secondary",
};
const STATUS_LABEL = {
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  PROCESSING: "Processing",
  RECORDED: "Recorded",
};

function PublishRecordingModal({ session, onClose, onPublished }) {
  const [url, setUrl] = useState("");
  const [passcode, setPasscode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await sessionsApi.publishRecording(session.id, { zoomRecording: url, zoomPasscode: passcode || undefined });
      onPublished();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[480px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-headline text-xl font-extrabold">Publish Recording</h2>
            <p className="text-xs text-ink-muted mt-1 truncate max-w-[300px]">{session.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Recording URL</label>
            <input required type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://zoom.us/rec/..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Passcode (optional)</label>
            <input type="text" value={passcode} onChange={e => setPasscode(e.target.value)}
              placeholder="Recording passcode"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-secondary to-secondary-container text-white font-headline font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Publishing…" : "Publish Recording"}
          </button>
        </form>
      </div>
    </div>
  );
}

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
    recordingOnly: false,
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
      zoomRecording: form.recordingOnly && form.zoomRecording ? form.zoomRecording : undefined,
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
          {/* Recording Only toggle */}
          {!isEdit && (
            <label className="flex items-center gap-3 p-3 bg-surface-low rounded-xl cursor-pointer">
              <input type="checkbox" checked={form.recordingOnly} onChange={e => setForm(f => ({ ...f, recordingOnly: e.target.checked }))}
                className="accent-secondary w-4 h-4" />
              <div>
                <p className="text-sm font-semibold">Recording Only</p>
                <p className="text-xs text-ink-muted">Publish a recording directly without a live session</p>
              </div>
            </label>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Title</label>
              <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Topic</label>
              <input required type="text" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Date &amp; Time</label>
              <input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Duration (min)</label>
              <input required type="number" min="1" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Session Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.sessionPrice} onChange={e => setForm(f => ({ ...f, sessionPrice: e.target.value }))}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Linked Course</label>
              <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
                <option value="">— Standalone —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          {form.recordingOnly && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Recording URL</label>
              <input type="url" value={form.zoomRecording} onChange={e => setForm(f => ({ ...f, zoomRecording: e.target.value }))}
                placeholder="https://zoom.us/rec/..."
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Session"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    try {
      const [sData, cData] = await Promise.all([sessionsApi.list(), coursesApi.list()]);
      setSessions(sData.sessions || []);
      setCourses(cData.courses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(action, sessionId) {
    setActionLoading(prev => ({ ...prev, [sessionId]: action }));
    try {
      if (action === "start") await sessionsApi.start(sessionId);
      else if (action === "end") await sessionsApi.end(sessionId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this session?")) return;
    try { await sessionsApi.delete(id); await load(); } catch (err) { setError(err.message); }
  }

  const scheduled = sessions.filter(s => s.status === "SCHEDULED");
  const rest = sessions.filter(s => s.status !== "SCHEDULED");

  function SessionRow({ s }) {
    const loading = actionLoading[s.id];
    const courseName = s.course?.name || "Standalone";
    return (
      <tr className="border-t border-surface-high/50 hover:bg-white/30 transition-colors">
        <td className="px-5 py-4">
          <p className="font-bold text-sm">{s.title}</p>
          <p className="text-xs text-ink-muted">{s.topic}</p>
        </td>
        <td className="px-5 py-4 text-xs text-ink-muted">{courseName}</td>
        <td className="px-5 py-4 text-sm text-ink-muted">{new Date(s.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
        <td className="px-5 py-4">
          <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold ${STATUS_COLORS[s.status] || "bg-surface-high text-ink-muted"}`}>
            {STATUS_LABEL[s.status] || s.status}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            {s.status === "SCHEDULED" && (
              <button onClick={() => handleAction("start", s.id)} disabled={!!loading}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1">
                {loading === "start" ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>}
                Start
              </button>
            )}
            {s.status === "LIVE" && (
              <button onClick={() => handleAction("end", s.id)} disabled={!!loading}
                className="px-3 py-1.5 bg-danger text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1">
                {loading === "end" ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>}
                End Session
              </button>
            )}
            {s.status === "PROCESSING" && (
              <button onClick={() => setPublishTarget(s)}
                className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">upload</span>
                Publish Recording
              </button>
            )}
            <button onClick={() => { setEditSession(s); setShowModal(true); }}
              className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
            <button onClick={() => handleDelete(s.id)}
              className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors">
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const tableHead = (
    <thead>
      <tr className="bg-surface-low">
        {["Title", "Course", "Scheduled", "Status", "Actions"].map(h => (
          <th key={h} className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted text-left">{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Sessions</h1>
          <p className="text-ink-muted text-base leading-relaxed">Manage live sessions and recordings.</p>
        </div>
        <button onClick={() => { setEditSession(null); setShowModal(true); }}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all shrink-0">
          + New Session
        </button>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{error}</div>}

      {/* Scheduled Sessions — Priority section */}
      {!loading && scheduled.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            <h2 className="font-headline font-bold text-lg">Scheduled Sessions</h2>
            <span className="px-2.5 py-0.5 bg-primary-light text-primary text-xs font-bold rounded-full">{scheduled.length}</span>
          </div>
          <div className="glass rounded-2xl shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                {tableHead}
                <tbody>
                  {scheduled.map(s => <SessionRow key={s.id} s={s} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Sessions */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-3 p-5 border-b border-surface-high">
          <h2 className="font-headline font-bold text-base">All Sessions</h2>
          <span className="px-2.5 py-0.5 bg-surface-high text-ink-muted text-xs font-bold rounded-full">{sessions.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {tableHead}
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1, 2, 3, 4, 5].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-24" /></td>)}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-ink-muted">
                  <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">video_library</span>
                  No sessions yet.
                </td></tr>
              ) : sessions.map(s => <SessionRow key={s.id} s={s} />)}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SessionModal
          session={editSession}
          courses={courses}
          onClose={() => { setShowModal(false); setEditSession(null); }}
          onSaved={load}
        />
      )}

      {publishTarget && (
        <PublishRecordingModal
          session={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublished={load}
        />
      )}
    </>
  );
}
