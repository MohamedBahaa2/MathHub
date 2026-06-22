"use client";
import { useState } from "react";

const ASSIGNMENTS = [
  { id: 1, student: "Sara M.", title: "Riemann Sum Integrals", submitted: "June 20, 2025", grade: 95, status: "Graded" },
  { id: 2, student: "Karim A.", title: "Linear Transformations", submitted: "June 21, 2025", grade: null, status: "Pending" },
  { id: 3, student: "Youssef A.", title: "Vector Field Visualizations", submitted: "June 22, 2025", grade: null, status: "Pending" },
  { id: 4, student: "Omar S.", title: "Riemann Sum Integrals", submitted: "June 19, 2025", grade: 78, status: "Graded" },
];
const TABS = ["Pending Review", "All", "Graded"];
const STATUS_COLORS = { Pending: "bg-warning-light text-[#8B6914]", Graded: "bg-primary-light text-primary" };

export default function AdminAssignmentsPage() {
  const [tab, setTab] = useState("Pending Review");
  const [selected, setSelected] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const filtered = ASSIGNMENTS.filter(a => {
    if (tab === "All") return true;
    if (tab === "Graded") return a.status === "Graded";
    return a.status === "Pending";
  });

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Assignments</h1>
        <p className="text-ink-muted text-base leading-relaxed">Review student submissions and assign grades and feedback.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>{t}</button>)}
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        {/* Table */}
        <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-surface-low">
                {["Student", "Assignment", "Submitted", "Grade", "Status", ""].map(h => <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className={`hover:bg-white/50 transition-colors border-t border-surface-high/50 cursor-pointer ${selected?.id === a.id ? "bg-primary-xlight" : ""}`} onClick={() => { setSelected(a); setGrade(a.grade || ""); setFeedback(""); }}>
                    <td className="px-6 py-4 font-bold text-sm">{a.student}</td>
                    <td className="px-6 py-4 text-sm">{a.title}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{a.submitted}</td>
                    <td className="px-6 py-4 font-headline font-bold text-primary text-sm">{a.grade ? `${a.grade}/100` : "—"}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                    <td className="px-6 py-4"><span className="material-symbols-outlined text-ink-muted text-lg">chevron_right</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Panel */}
        {selected && (
          <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-lg">Grade Submission</h3>
              <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-high transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-4 bg-surface-low rounded-xl mb-6">
              <p className="font-bold text-sm">{selected.title}</p>
              <p className="text-xs text-ink-muted">{selected.student} · {selected.submitted}</p>
              <button className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-secondary-light text-secondary text-xs font-bold rounded-full hover:brightness-95 transition-colors">
                <span className="material-symbols-outlined text-sm">description</span> View PDF Submission
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Score (0–100)</label>
                <input type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" placeholder="e.g. 87" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Feedback</label>
                <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all resize-none" placeholder="Write your feedback for the student..." />
              </div>
              <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
                Save Grade & Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
