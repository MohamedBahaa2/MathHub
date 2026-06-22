export const metadata = { title: "MathHub Admin — Reports" };

const STUDENTS = ["Sara Mohamed", "Karim Ahmed", "Youssef Ali", "Omar Sayed"];

export default function AdminReportsPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Reports</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Generate and review performance reports for individual students.</p>
      </div>

      {/* Generator */}
      <div className="glass rounded-2xl p-8 shadow-glass mb-8 animate-fade-in-up">
        <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">assessment</span> Generate Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Student</label>
            <select className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
              {STUDENTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">From</label>
            <input type="date" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">To</label>
            <input type="date" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
        </div>
        <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
          Generate Report
        </button>
      </div>

      {/* Preview Card */}
      <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-headline font-bold text-lg">Sara Mohamed — Weekly Report</h3>
            <p className="text-xs text-ink-muted">June 16 – June 22, 2025</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 border border-surface-high text-ink-muted text-sm font-bold rounded-xl hover:border-primary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">download</span> PDF
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[{ label: "Avg. Grade", value: "91%" }, { label: "Sessions", value: "3 / 3" }, { label: "Assignments", value: "2 Submitted" }, { label: "Requests", value: "1 Open" }].map(m => (
            <div key={m.label} className="p-4 bg-surface-low rounded-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{m.label}</p>
              <p className="font-headline text-xl font-extrabold text-primary mt-1">{m.value}</p>
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-2">Teacher Notes</label>
          <textarea rows={3} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" defaultValue="Sara is progressing well. Recommend focusing on integration by parts before the next session." />
        </div>
      </div>
    </>
  );
}
