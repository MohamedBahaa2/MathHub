export const metadata = {
  title: "MathHub — Assignments",
  description: "Track your math assignments, download materials, upload solutions, and review grades.",
};

const assignments = [
  { name: "Multivariable Calculus Set 1", due: "Due Oct 24, 2023", active: true, grade: "95/100", gradeType: "scored" },
  { name: "Linear Transformations", due: "Due Nov 02, 2023", active: false, grade: "Pending", gradeType: "pending" },
  { name: "Riemann Sum Integrals", due: "Due Nov 08, 2023", active: true, grade: "-- / 100", gradeType: "ungraded" },
  { name: "Vector Field Visualizations", due: "Due Nov 15, 2023", active: false, grade: "88/100", gradeType: "scored" },
];

function gradeBadgeClass(type) {
  if (type === "scored") return "bg-primary-light text-primary";
  if (type === "pending") return "bg-warning-light text-[#8B6914]";
  return "bg-surface-high text-ink-muted";
}

export default function AssignmentsPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Assignments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Track your problem sets and laboratory reports. Review faculty feedback and upload your completed solutions in PDF format.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "pending_actions", label: "To Do", value: "04 Tasks", colors: "bg-primary-light text-primary" },
          { icon: "verified", label: "Completed", value: "12 Sets", colors: "bg-secondary-light text-secondary" },
          { icon: "analytics", label: "Current GPA", value: "3.8 / 4.0", colors: "bg-surface-high text-ink-muted" },
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

      {/* Table */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden mb-8 animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                <th className="px-6 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">Assignment Name</th>
                <th className="px-6 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">Material</th>
                <th className="px-6 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">Submission</th>
                <th className="px-6 py-5 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted text-right">Grade</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={i} className="hover:bg-white/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${a.active ? "bg-primary shadow-[0_0_8px_rgba(144,51,17,0.4)]" : "bg-surface-highest"}`} />
                      <div>
                        <p className="font-headline font-bold">{a.name}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{a.due}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary text-xs font-bold rounded-full shadow-primary hover:brightness-110 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-base">download</span> Download PDF
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 border-[1.5px] border-primary text-primary text-xs font-bold rounded-full hover:bg-primary-light active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-base">upload</span> Upload Solution
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${gradeBadgeClass(a.gradeType)}`}>{a.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
        <div className="glass rounded-2xl p-8 shadow-glass flex gap-6 animate-fade-in-up">
          <span className="material-symbols-outlined text-[2rem] text-primary shrink-0">info</span>
          <div>
            <h4 className="font-headline text-lg font-bold mb-2">Late Policy</h4>
            <p className="text-sm text-ink-muted leading-relaxed">Submissions received after the deadline will incur a 5% reduction in grade per day. Please contact Support for extension requests.</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-8 shadow-glass flex gap-6 animate-fade-in-up">
          <span className="material-symbols-outlined text-[2rem] text-secondary shrink-0">auto_fix_high</span>
          <div>
            <h4 className="font-headline text-lg font-bold mb-2">AI Feedback</h4>
            <p className="text-sm text-ink-muted leading-relaxed">Our predictive engine analyzes your submissions to suggest personalized study resources. Check the Analytics tab after grading.</p>
          </div>
        </div>
      </div>
    </>
  );
}
