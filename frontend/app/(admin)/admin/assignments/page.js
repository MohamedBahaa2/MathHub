"use client";
import { useState, useEffect, useCallback } from "react";
import { assignments as assignmentsApi, sessions as sessionsApi } from "@/lib/api";

const TABS = ["Pending Review", "All", "Graded"];
const STATUS_COLORS = {
  Pending: "bg-warning-light text-[#8B6914]",
  Graded: "bg-primary-light text-primary",
};

function CreateAssignmentModal({ onClose, onCreated }) {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "", sessionId: "", materialUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionsApi.list().then(d => setSessions(d.sessions || [])).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        dueDate: new Date(form.dueDate).toISOString(),
        sessionId: form.sessionId || undefined,
        materialUrl: form.materialUrl || undefined,
      };
      await assignmentsApi.create(payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-extrabold">Create Assignment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Title</label>
            <input required type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Calculus Problem Set 1"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description (optional)</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Instructions or details for students..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Due Date</label>
            <input required type="datetime-local" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Linked Session (optional)</label>
            <select value={form.sessionId} onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
              <option value="">— No session —</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Material PDF URL (optional)</label>
            <input type="url" value={form.materialUrl}
              onChange={e => setForm(p => ({ ...p, materialUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Creating…" : "Create Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function GradePanel({ submission, assignmentId, onGraded, onClose }) {
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGrade(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await assignmentsApi.grade(assignmentId, submission.id, Number(grade), feedback);
      setSuccess(true);
      onGraded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up h-fit sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-lg">Grade Submission</h3>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-high">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="p-4 bg-surface-low rounded-xl mb-6">
        <p className="font-bold text-sm">{submission.assignment?.title}</p>
        <p className="text-xs text-ink-muted mt-1">{submission.student?.name} · {submission.student?.studentCode}</p>
        <p className="text-xs text-ink-muted">{submission.student?.email}</p>
        {submission.submittedAt && (
          <p className="text-xs text-ink-muted mt-1">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
        )}
        {submission.fileUrl && (
          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-secondary-light text-secondary text-xs font-bold rounded-full hover:brightness-95 transition-colors">
            <span className="material-symbols-outlined text-sm">description</span> View Submission
          </a>
        )}
      </div>

      {success ? (
        <div className="px-4 py-3 bg-primary-light text-primary rounded-xl text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Grade saved! Student notified.
        </div>
      ) : (
        <form onSubmit={handleGrade} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Score (0–100)</label>
            <input required type="number" min="0" max="100" value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="e.g. 87"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Feedback</label>
            <textarea rows={4} value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Write your feedback for the student..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          {error && <div className="px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save Grade & Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminAssignmentsPage() {
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Pending Review");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const d = await assignmentsApi.list();
      const list = d.assignments || [];
      setAssignmentsList(list);
      // Load submissions for all assignments
      setLoadingSubs(true);
      const subResults = await Promise.allSettled(
        list.map(a => assignmentsApi.getSubmissions(a.id).then(r => r.submissions?.map(s => ({ ...s, assignment: a })) ?? []))
      );
      const subs = subResults.flatMap(r => r.status === "fulfilled" ? r.value : []);
      setAllSubmissions(subs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingSubs(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = allSubmissions.filter(s => {
    if (tab === "All") return true;
    if (tab === "Graded") return s.grade != null;
    return s.grade == null; // Pending Review
  });

  const pendingCount = allSubmissions.filter(s => s.grade == null).length;

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Assignments</h1>
          <p className="text-ink-muted text-base leading-relaxed">
            Manage assignments and grade student submissions.
            {pendingCount > 0 && !loading && (
              <span className="ml-2 px-2.5 py-0.5 bg-warning-light text-[#8B6914] text-xs font-bold rounded-full">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Create Assignment
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
            {t}
            {t === "Pending Review" && pendingCount > 0 && !loading && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-warning text-white text-[0.6rem] font-extrabold rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>
        {/* Submissions Table */}
        <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low">
                  {["Student", "Assignment", "Session", "Submitted", "Grade", "Status", ""].map(h => (
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-ink-muted">
                      <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">assignment</span>
                      {tab === "Pending Review" ? "No pending submissions!" : "No submissions found."}
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id}
                    className={`hover:bg-white/50 transition-colors border-t border-surface-high/50 cursor-pointer ${selected?.id === s.id ? "bg-primary-xlight" : ""}`}
                    onClick={() => { setSelected(s); }}>
                    <td className="px-6 py-4 font-bold text-sm">{s.student?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-sm">{s.assignment?.title ?? "—"}</td>
                    <td className="px-6 py-4 text-xs text-ink-muted">{s.assignment?.session?.title ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 font-headline font-bold text-primary text-sm">
                      {s.grade != null ? `${s.grade}/100` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.grade != null ? STATUS_COLORS.Graded : STATUS_COLORS.Pending}`}>
                        {s.grade != null ? "Graded" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="material-symbols-outlined text-ink-muted text-lg">chevron_right</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Also show Assignments list with no submissions at bottom */}
          {tab === "All" && assignmentsList.length > 0 && (
            <div className="border-t border-surface-high px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-muted mb-3">All Assignments ({assignmentsList.length})</p>
              <div className="flex flex-col gap-2">
                {assignmentsList.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-ink-muted">{a.session?.title ?? "No session"} · Due {new Date(a.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-ink-muted font-semibold">{a._count?.submissions ?? 0} submissions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grade Panel */}
        {selected && (
          <GradePanel
            key={selected.id}
            submission={selected}
            assignmentId={selected.assignmentId}
            onGraded={loadData}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {showCreate && <CreateAssignmentModal onClose={() => setShowCreate(false)} onCreated={loadData} />}
    </>
  );
}
