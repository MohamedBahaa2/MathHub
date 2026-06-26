"use client";
import { useState, useEffect } from "react";
import { reports as reportsApi, users as usersApi } from "@/lib/api";

function GenerateModal({ students, onClose, onGenerated }) {
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? "",
    weekStart: "",
    weekEnd: "",
    sessionsAttended: 0,
    assignmentsSubmitted: 0,
    avgGrade: "",
    quizAvgScore: "",
    teacherNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await reportsApi.generate({
        studentId: form.studentId,
        weekStart: new Date(form.weekStart).toISOString(),
        weekEnd: new Date(form.weekEnd).toISOString(),
        sessionsAttended: Number(form.sessionsAttended),
        assignmentsSubmitted: Number(form.assignmentsSubmitted),
        avgGrade: form.avgGrade ? Number(form.avgGrade) : undefined,
        quizAvgScore: form.quizAvgScore ? Number(form.quizAvgScore) : undefined,
        teacherNotes: form.teacherNotes || undefined,
      });
      onGenerated();
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
          <h2 className="font-headline text-xl font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assessment</span> Generate Report
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Student</label>
            <select required value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.studentCode ?? s.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Week Start</label>
              <input required type="date" value={form.weekStart}
                onChange={e => setForm(p => ({ ...p, weekStart: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Week End</label>
              <input required type="date" value={form.weekEnd}
                onChange={e => setForm(p => ({ ...p, weekEnd: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Sessions Attended</label>
              <input type="number" min="0" value={form.sessionsAttended}
                onChange={e => setForm(p => ({ ...p, sessionsAttended: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Assignments Submitted</label>
              <input type="number" min="0" value={form.assignmentsSubmitted}
                onChange={e => setForm(p => ({ ...p, assignmentsSubmitted: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Avg. Grade (%)</label>
              <input type="number" min="0" max="100" value={form.avgGrade}
                onChange={e => setForm(p => ({ ...p, avgGrade: e.target.value }))}
                placeholder="e.g. 88"
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Quiz Avg. Score (%)</label>
              <input type="number" min="0" max="100" value={form.quizAvgScore}
                onChange={e => setForm(p => ({ ...p, quizAvgScore: e.target.value }))}
                placeholder="e.g. 75"
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Teacher Notes</label>
            <textarea rows={4} value={form.teacherNotes}
              onChange={e => setForm(p => ({ ...p, teacherNotes: e.target.value }))}
              placeholder="Summarize the student's weekly performance..."
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Generating…" : "Generate Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [reportsList, setReportsList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([
        reportsApi.list(),
        usersApi.list("?role=STUDENT&limit=100"),
      ]);
      setReportsList(r.reports || []);
      setStudents(u.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleDownloadPdf(id) {
    setDownloading(id);
    try {
      const res = await reportsApi.downloadPdf(id);
      if (!res.ok) throw new Error("PDF not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `report-${id}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Reports</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
            Generate and manage weekly performance reports for students.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={students.length === 0}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0 disabled:opacity-60">
          + Generate Report
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {/* Reports list */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["Student", "Week", "Sessions", "Assignments", "Avg. Grade", "Quiz Score", "Generated", "PDF"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1,2,3,4,5,6,7,8].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-20" /></td>)}
                  </tr>
                ))
              ) : reportsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-ink-muted">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">assessment</span>
                    No reports generated yet. Click &quot;Generate Report&quot; to start.
                  </td>
                </tr>
              ) : reportsList.map(r => (
                <tr key={r.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center text-xs font-bold">
                        {r.student?.name?.[0] ?? "S"}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{r.student?.name}</p>
                        <p className="text-xs text-ink-muted">{r.student?.studentCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">
                    {new Date(r.weekStart).toLocaleDateString()} – {new Date(r.weekEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-center">{r.sessionsAttended}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-center">{r.assignmentsSubmitted}</td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">
                    {r.avgGrade != null ? `${r.avgGrade}%` : "—"}
                  </td>
                  <td className="px-6 py-4 font-headline font-bold text-secondary">
                    {r.quizAvgScore != null ? `${r.quizAvgScore}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">
                    {new Date(r.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDownloadPdf(r.id)}
                      disabled={downloading === r.id}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40">
                      {downloading === r.id
                        ? <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-lg">download</span>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && students.length > 0 && (
        <GenerateModal students={students} onClose={() => setShowModal(false)} onGenerated={loadData} />
      )}
    </>
  );
}
