export const metadata = {
  title: "MathHub — Recorded Sessions",
  description: "Browse and watch recorded math sessions — deep-dive intensives in calculus, algebra, topology, and more.",
};

const sessions = [
  { icon: "calculate", color: "primary", title: "Intro to Calculus", desc: "Master multivariable integration and vector fields through visual proofing.", hours: "2.5 hours", progress: 65 },
  { icon: "view_in_ar", color: "secondary", title: "Differentiation", desc: "A structural approach to matrices, eigenvectors, and coordinate transformations.", hours: "3 hours", progress: 12 },
  { icon: "change_history", color: "neutral", title: "Topology Foundations", desc: "Deformable spaces and the mathematical foundation of continuous shapes.", hours: "4 hours", progress: 88 },
  { icon: "data_exploration", color: "secondary", title: "Dynamic Systems", desc: "Modeling dynamic systems and finding harmony in the rates of change.", hours: "2 hours", progress: 45 },
  { icon: "bar_chart", color: "primary", title: "Statistical Mechanics", desc: "Exploring the laws of large numbers and entropy in physical systems.", hours: "3.5 hours", progress: 0 },
];

function colorClasses(color) {
  if (color === "primary") return "bg-primary-light text-primary";
  if (color === "secondary") return "bg-secondary-light text-secondary";
  return "bg-surface-high text-ink-muted";
}

export default function RecordedSessionsPage() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Recorded Sessions</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Deep-dive intensives designed to transform theoretical concepts into intuitive mastery.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-surface-low rounded-xl text-sm font-semibold text-ink-muted hover:bg-surface-high transition-colors shrink-0">
          <span className="material-symbols-outlined text-base">filter_list</span>
          Filter by Level
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger">
        {sessions.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-6 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses(s.color)}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <h3 className="font-headline text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-ink-muted mb-6 flex-1 leading-relaxed">{s.desc}</p>
            <div className="w-full h-[120px] bg-surface-high rounded-xl mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-ink-muted/30">play_circle</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-2 text-ink-muted">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>{s.hours}</span>
              </div>
              <span className="font-bold text-primary">{s.progress}% Done</span>
            </div>
            <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${s.progress}%` }} />
            </div>
            <div className="mt-6">
              <button className="w-full py-3 bg-surface-highest text-primary font-headline font-bold rounded-xl hover:bg-primary hover:text-ink-on-primary active:scale-95 transition-all duration-300">
                {s.progress > 0 ? "Continue Session" : "Start Session"}
              </button>
            </div>
          </div>
        ))}

        {/* Request a Topic */}
        <div className="border-2 border-dashed border-black/12 rounded-2xl flex flex-col items-center justify-center text-center p-8 hover:border-primary transition-colors duration-300 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary-xlight flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">add</span>
          </div>
          <h3 className="font-headline font-bold text-lg mb-2">Request a Topic</h3>
          <p className="text-sm text-ink-muted px-4">Can&apos;t find what you&apos;re looking for? Suggest a new session topic to the faculty.</p>
          <button className="mt-4 text-primary font-bold text-sm hover:bg-primary-xlight px-4 py-2 rounded-xl transition-colors">Submit Proposal</button>
        </div>
      </div>
    </>
  );
}
