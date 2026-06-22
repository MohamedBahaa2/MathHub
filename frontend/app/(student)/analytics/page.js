export const metadata = {
  title: "MathHub — Analytics",
  description: "Real-time student analytics dashboard — track grades, completion rates, topic performance, and insights.",
};

const topics = [
  { name: "Advanced Calculus", value: 98, color: "primary" },
  { name: "Linear Algebra", value: 84, color: "secondary" },
  { name: "Discrete Mathematics", value: 71, color: "danger" },
  { name: "Bayesian Statistics", value: 65, color: "secondary" },
];

const submissions = [
  { symbol: "Σ", title: "Riemann Hypothesis Sub-case", sub: "Calculus · 2 hours ago", grade: "A+", colors: "bg-primary-light text-primary" },
  { symbol: "×", title: "Affine Transformations", sub: "Geometry · Yesterday", grade: "B", colors: "bg-secondary-light text-secondary" },
  { symbol: "μ", title: "Null Hypothesis Testing", sub: "Statistics · 3 days ago", grade: "A", colors: "bg-surface-high text-ink-muted" },
];

const barHeights = [40, 55, 48, 85, 62, 72, 92];
const barLabels = ["Sept", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default function AnalyticsPage() {
  // SVG ring math: circumference = 2πr = 2π×80 ≈ 502.6, 82% → dashoffset = 502.6 * (1 - 0.82) ≈ 90.5
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 animate-fade-in-up">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-primary mb-1">Student Analytics</p>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Cognitive Trajectory</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Real-time intelligence dashboard tracking your mathematical growth and conceptual mastery.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-ink-muted">Export Ledger</span>
          <span className="px-4 py-2 bg-secondary text-white rounded-full text-xs font-bold">Academic Period: Spring 2024</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 stagger">

        {/* Grade Velocity (8 cols) */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">Grade Velocity</h3>
              <p className="text-sm text-ink-muted">Performance trend over time</p>
            </div>
            <span className="material-symbols-outlined text-ink-muted">trending_up</span>
          </div>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-headline text-6xl font-extrabold leading-none">3.88</span>
            <span className="text-lg font-semibold text-ink-muted">GPA</span>
          </div>
          <div className="flex items-end justify-between gap-4 h-[180px] px-2 mb-2">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-xl relative cursor-pointer transition-all duration-400 hover:brightness-95 ${
                  h >= 80 ? "bg-primary shadow-[0_4px_16px_rgba(144,51,17,0.2)]" : "bg-surface-high"
                }`}
                style={{ height: `${h}%` }}
              >
                {i === 3 && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-surface text-[0.625rem] font-bold px-2 py-0.5 rounded whitespace-nowrap">92%</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[0.625rem] font-bold uppercase tracking-wide text-ink-muted">
            {barLabels.map((l) => <span key={l}>{l}</span>)}
          </div>
          <p className="text-xs text-ink-muted mt-3">92nd percentile against historical cohort</p>
        </div>

        {/* Completion Ring (4 cols) */}
        <div className="col-span-12 lg:col-span-4 glass rounded-2xl p-8 shadow-glass flex flex-col items-center justify-center text-center animate-fade-in-up">
          <h3 className="font-headline text-xl font-bold mb-1">Proof Completion</h3>
          <p className="text-sm text-ink-muted mb-6">Curriculum progress</p>
          <div className="relative w-[180px] h-[180px] flex items-center justify-center mb-6">
            <svg viewBox="0 0 192 192" className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="80" fill="transparent" className="stroke-surface-high" strokeWidth="10" />
              <circle cx="96" cy="96" r="80" fill="transparent" className="stroke-primary" strokeWidth="10" strokeLinecap="round"
                strokeDasharray="502.6" strokeDashoffset="90.5" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-headline text-4xl font-extrabold">82%</span>
              <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-ink-muted">Mastery</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-3 bg-surface-low rounded-2xl text-left">
              <p className="text-[0.5625rem] font-bold uppercase text-ink-muted">Completed</p>
              <p className="text-lg font-bold">142 <span className="text-xs font-normal opacity-50">units</span></p>
            </div>
            <div className="p-3 bg-surface-low rounded-2xl text-left">
              <p className="text-[0.5625rem] font-bold uppercase text-ink-muted">Pending</p>
              <p className="text-lg font-bold">31 <span className="text-xs font-normal opacity-50">units</span></p>
            </div>
          </div>
        </div>

        {/* Intelligence Insights (4 cols, teal) */}
        <div className="col-span-12 lg:col-span-4 bg-secondary text-ink-on-primary rounded-2xl p-8 shadow-teal relative overflow-hidden animate-fade-in-up">
          <div className="absolute -top-5 -right-5 w-[120px] h-[120px] bg-white/8 rounded-full" />
          <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            Intelligence Insights
          </h3>
          <div className="mb-6">
            <h4 className="text-[0.6875rem] font-bold uppercase tracking-widest opacity-80 mb-2">Focus Recommendation</h4>
            <p className="text-sm leading-relaxed opacity-90">&ldquo;Your derivation speed in <strong>Vector Calculus</strong> is exceptional, but retention in <strong>Topology</strong> drops after 48 hours. Suggesting a 15-minute recursive review cycle.&rdquo;</p>
          </div>
          <div className="mb-6">
            <h4 className="text-[0.6875rem] font-bold uppercase tracking-widest opacity-80 mb-2">Logic Pattern</h4>
            <p className="text-sm leading-relaxed opacity-90">Detected high proficiency in &ldquo;Proof by Contradiction&rdquo;. You are solving these 22% faster than the median academic pace.</p>
          </div>
          <button className="px-5 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors">
            Unlock Detailed Logic Map
          </button>
        </div>

        {/* Topic Performance (8 cols) */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-headline text-xl font-bold">Disciplinary Performance</h3>
              <p className="text-sm text-ink-muted">Granular mastery metrics across mathematical disciplines</p>
            </div>
          </div>
          <div className="flex gap-4 mb-6 mt-4">
            <span className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="w-2 h-2 rounded-full bg-primary" /> Calculus</span>
            <span className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="w-2 h-2 rounded-full bg-secondary" /> Algebra</span>
            <span className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="w-2 h-2 rounded-full bg-ink-muted" /> Statistics</span>
          </div>
          <div className="flex flex-col gap-5">
            {topics.map((t, i) => (
              <div key={i} className="cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className={`text-sm font-bold ${
                    t.color === "primary" ? "text-primary" : t.color === "secondary" ? "text-secondary" : "text-danger"
                  }`}>{t.value}%</span>
                </div>
                <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 group-hover:brightness-110 ${
                    t.color === "primary" ? "bg-primary" : t.color === "secondary" ? "bg-secondary" : "bg-danger"
                  }`} style={{ width: `${t.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Recent Submissions */}
          <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
            <h3 className="font-headline text-lg font-bold mb-6">Recent Proof Submissions</h3>
            <div className="flex flex-col divide-y divide-black/5">
              {submissions.map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold font-headline shrink-0 ${s.colors}`}>{s.symbol}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{s.title}</h4>
                    <p className="text-[0.6875rem] text-ink-muted uppercase tracking-wide mt-0.5">{s.sub}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.colors}`}>{s.grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
            <h3 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary">emoji_events</span>
              Academic Milestones
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { val: "100", label: "Theorems Proved", border: "border-primary", color: "text-primary" },
                { val: "12k", label: "Logic Chains", border: "border-secondary", color: "text-secondary" },
                { val: "14", label: "Collab Projects", border: "border-ink-muted", color: "text-ink-muted" },
              ].map((m, i) => (
                <div key={i} className={`p-4 border-l-[3px] ${m.border}`}>
                  <p className={`font-headline text-2xl font-extrabold ${m.color}`}>{m.val}</p>
                  <p className="text-[0.5625rem] font-bold uppercase tracking-wide text-ink-muted">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary-light rounded-xl text-sm text-primary font-semibold">
              Next Milestone: <strong>Digital Archimedes</strong> (5 Proofs remaining)
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
