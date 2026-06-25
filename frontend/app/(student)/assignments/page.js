"use client";
import { useState, useEffect, useRef } from "react";
import { assignments as assignmentsApi, getUser } from "@/lib/api";

function gradeBadgeClass(grade) {
  if (grade == null) return "bg-surface-high text-ink-muted";
  if (grade >= 80) return "bg-primary-light text-primary";
  if (grade >= 60) return "bg-warning-light text-[#8B6914]";
  return "bg-danger-light text-danger";
}

export default function AssignmentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState({});
  const [uploadMsg, setUploadMsg] = useState({});
  const fileRefs = useRef({});
  const user = getUser();

  useEffect(() => {
    assignmentsApi.list()
      .then(d => setList(d.assignments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(assignmentId, file) {
    setUploading(u => ({ ...u, [assignmentId]: true }));
    setUploadMsg(m => ({ ...m, [assignmentId]: "" }));
    try {
      await assignmentsApi.submit(assignmentId, file);
      setUploadMsg(m => ({ ...m, [assignmentId]: "✓ Submitted!" }));
      // Refresh
      const d = await assignmentsApi.list();
      setList(d.assignments || []);
    } catch (err) {
      setUploadMsg(m => ({ ...m, [assignmentId]: `✗ ${err.message}` }));
    } finally {
      setUploading(u => ({ ...u, [assignmentId]: false }));
    }
  }

  const pending = list.filter(a => new Date(a.dueDate) > new Date()).length;
  const submitted = list.filter(a => a.submissions?.some(s => s.studentId === user?.id)).length;

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Assignments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Track your problem sets. Download materials and upload your completed solutions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "pending_actions", label: "Pending", value: loading ? "—" : pending, colors: "bg-primary-light text-primary" },
          { icon: "verified", label: "Submitted", value: loading ? "—" : submitted, colors: "bg-secondary-light text-secondary" },
          { icon: "assignment", label: "Total", value: loading ? "—" : list.length, colors: "bg-surface-high text-ink-muted" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-6 shadow-glass flex items-center gap-4 animate-fade-in-up">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.colors}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{s.label}</p>
              <p className="font-headline text-xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="glass rounded-2xl shadow-glass overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse border-b border-surface-high/50" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-ink-muted shadow-glass">
          <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">assignment</span>
          <p className="font-semibold">No assignments yet</p>
        </div>
      ) : (
        <div className="glass rounded-2xl shadow-glass overflow-hidden mb-8 animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low">
                  {["Assignment", "Session", "Due Date", "Material", "Submission", "Grade"].map(h => (
                    <th key={h} className="px-6 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(a => {
                  const mySubmission = a.submissions?.find(s => s.studentId === user?.id);
                  const isPast = new Date(a.dueDate) < new Date();
                  return (
                    <tr key={a.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isPast ? "bg-surface-highest" : "bg-primary"}`} />
                          <div>
                            <p className="font-headline font-bold text-sm">{a.title}</p>
                            {a.description && <p className="text-xs text-ink-muted mt-0.5 max-w-[200px] truncate">{a.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-ink-muted">{a.session?.title ?? "—"}</td>
                      <td className="px-6 py-5 text-sm text-ink-muted">{new Date(a.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        {a.materialUrl ? (
                          <a href={a.materialUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary text-xs font-bold rounded-full shadow-primary hover:brightness-110 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-base">download</span> Download PDF
                          </a>
                        ) : <span className="text-xs text-ink-muted">—</span>}
                      </td>
                      <td className="px-6 py-5">
                        <input
                          ref={el => fileRefs.current[a.id] = el}
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleUpload(a.id, e.target.files[0])}
                        />
                        {mySubmission ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-secondary font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span> Submitted
                            </span>
                            <button onClick={() => fileRefs.current[a.id]?.click()}
                              className="text-xs text-ink-muted underline hover:text-primary">Re-upload</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileRefs.current[a.id]?.click()}
                            disabled={uploading[a.id]}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 border-[1.5px] border-primary text-primary text-xs font-bold rounded-full hover:bg-primary-light active:scale-95 transition-all disabled:opacity-50">
                            {uploading[a.id] ? (
                              <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-base">upload</span>
                            )}
                            {uploading[a.id] ? "Uploading…" : "Upload Solution"}
                          </button>
                        )}
                        {uploadMsg[a.id] && (
                          <p className={`text-xs mt-1 ${uploadMsg[a.id].startsWith("✓") ? "text-primary" : "text-danger"}`}>
                            {uploadMsg[a.id]}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {mySubmission?.grade != null ? (
                          <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${gradeBadgeClass(mySubmission.grade)}`}>
                            {mySubmission.grade}/100
                          </span>
                        ) : (
                          <span className="px-4 py-1 rounded-full text-sm font-bold bg-surface-high text-ink-muted">
                            {mySubmission ? "Pending" : "—"}
                          </span>
                        )}
                        {mySubmission?.feedback && (
                          <p className="text-xs text-ink-muted mt-1 max-w-[120px] truncate">{mySubmission.feedback}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
