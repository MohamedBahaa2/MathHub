export const metadata = { title: "MathHub Parent — Reports" };

const REPORTS = [
  { student: "Sara Mohamed", week: "June 16–22", grade: "A−", trend: "up", sessions: "3/3", assignments: "2", notes: "Performing consistently. Encourage more practice on integration techniques." },
  { student: "Sara Mohamed", week: "June 9–15", grade: "B+", trend: "up", sessions: "2/3", assignments: "2", notes: "Missed one session but submitted all assignments on time." },
  { student: "Omar Sayed", week: "June 16–22", grade: "B+", trend: "down", sessions: "2/3", assignments: "3", notes: "Good assignment score this week, attendance needs improvement." },
];

export default function ParentReportsPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Reports</h1>
        <p className="text-ink-muted text-base leading-relaxed">Weekly performance reports for your children.</p>
      </div>

      <div className="flex flex-col gap-6">
        {REPORTS.map((r, i) => (
          <div key={i} className="glass rounded-2xl p-8 shadow-glass hover:shadow-elevated transition-all animate-fade-in-up">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">{r.student}</p>
                <h3 className="font-headline text-xl font-extrabold mt-0.5">Week of {r.week}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 text-sm font-bold ${r.trend === "up" ? "text-primary" : "text-danger"}`}>
                  <span className="material-symbols-outlined text-lg">{r.trend === "up" ? "trending_up" : "trending_down"}</span>
                  {r.grade}
                </span>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-surface-high text-ink-muted text-sm font-bold rounded-xl hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">download</span> PDF
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[{ l: "Grade", v: r.grade }, { l: "Sessions", v: r.sessions }, { l: "Assignments", v: r.assignments }, { l: "Avg %", v: "91%" }].map(m => (
                <div key={m.l} className="p-4 bg-surface-low rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{m.l}</p>
                  <p className="font-headline text-xl font-extrabold text-primary mt-1">{m.v}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-secondary-xlight rounded-xl border-l-2 border-secondary">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">Teacher Note</p>
              <p className="text-sm text-ink leading-relaxed">{r.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
