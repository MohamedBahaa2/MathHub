"use client";
import { useState } from "react";

const LINKED_STUDENTS = [
  { id: "1", name: "Sara Mohamed", grade: "A−", sessions: 3, assignments: 2 },
  { id: "2", name: "Omar Sayed", grade: "B+", sessions: 2, assignments: 3 },
];

export default function ParentDashboardPage() {
  const [selectedStudent, setSelectedStudent] = useState(LINKED_STUDENTS[0]);

  return (
    <>
      {/* Header with student selector */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Parent Overview</h1>
          <p className="text-ink-muted text-base leading-relaxed">Monitor your child's progress and performance.</p>
        </div>
        <div className="flex gap-2">
          {LINKED_STUDENTS.map(s => (
            <button key={s.id} onClick={() => setSelectedStudent(s)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${selectedStudent.id === s.id ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "grade", label: "Average Grade", value: selectedStudent.grade, color: "text-primary", bg: "bg-primary-light" },
          { icon: "play_circle", label: "Sessions This Week", value: `${selectedStudent.sessions} / 3`, color: "text-secondary", bg: "bg-secondary-light" },
          { icon: "assignment", label: "Assignments Submitted", value: selectedStudent.assignments, color: "text-[#8B6914]", bg: "bg-warning-light" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-6 shadow-glass flex items-center gap-4 hover:shadow-elevated hover:-translate-y-1 transition-all animate-fade-in-up">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-headline text-2xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Report + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">assessment</span> Latest Report
            </h3>
            <a href="/parent/reports" className="text-sm text-secondary font-bold hover:opacity-70 transition-opacity">View all →</a>
          </div>
          <div className="p-4 bg-surface-low rounded-xl mb-4">
            <p className="font-bold text-sm mb-1">{selectedStudent.name} — Week of June 16–22</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[{ l: "Avg Grade", v: selectedStudent.grade }, { l: "Sessions Watched", v: "3/3" }, { l: "Assignments", v: "2 Submitted" }, { l: "Requests", v: "1 Open" }].map(m => (
                <div key={m.l}>
                  <p className="text-xs text-ink-muted">{m.l}</p>
                  <p className="font-headline font-bold text-primary">{m.v}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-ink-muted italic">Teacher note: "Performing consistently. Encourage more practice on integration techniques."</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <h3 className="font-headline font-bold text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upcoming</span> Upcoming
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { type: "Session", title: "Calculus I — Limits", date: "June 28 · 6PM", icon: "play_circle" },
              { type: "Assignment", title: "Vector Field Visualizations", date: "Due June 30", icon: "assignment" },
              { type: "Session", title: "Statistics — Probability", date: "July 5 · 6PM", icon: "play_circle" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-low rounded-xl">
                <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wide">{item.type}</p>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-ink-muted">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
