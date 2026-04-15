export const metadata = {
  title: "MathHub — Dashboard",
  description: "Track your mathematical journey, active modules, and daily challenges.",
};

export default function DashboardPage() {
  return (
    <>
      {/* Welcome */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Welcome back, Scholar.</h1>
        <p className="text-ink-muted text-base mt-1">Your intellectual journey is 64% complete this term.</p>
      </div>

      {/* Active Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 stagger">
        {/* Calculus */}
        <div className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[0.625rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-light text-primary">Active Module</span>
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
            </div>
          </div>
          <h3 className="font-headline text-2xl font-extrabold mb-6">Calculus I</h3>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm text-ink-muted font-medium">Mastery</span>
            <span className="font-headline text-3xl font-extrabold text-primary">75%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "75%" }} />
          </div>
          <p className="mt-4 text-sm text-ink-muted">Next: <strong className="text-ink">Integration by Parts</strong> · 12 mins</p>
        </div>

        {/* Linear Algebra */}
        <div className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[0.625rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-secondary-light text-secondary">Active Module</span>
            <div className="w-11 h-11 rounded-xl bg-secondary-light text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
            </div>
          </div>
          <h3 className="font-headline text-2xl font-extrabold mb-6">Linear Algebra</h3>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm text-ink-muted font-medium">Mastery</span>
            <span className="font-headline text-3xl font-extrabold text-secondary">30%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: "30%" }} />
          </div>
          <p className="mt-4 text-sm text-ink-muted">Next: <strong className="text-ink">Eigenvalues & Vectors</strong> · 45 mins</p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 stagger">
        {/* Daily Challenge */}
        <div className="bg-gradient-to-br from-ink to-[#2D2D2D] rounded-2xl p-8 lg:p-10 relative overflow-hidden shadow-elevated animate-fade-in-up">
          <div className="inline-flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-primary mb-4">
            <span className="material-symbols-outlined text-base">bolt</span>
            Daily Challenge
          </div>
          <h2 className="font-headline text-2xl lg:text-[1.75rem] font-extrabold text-white leading-tight mb-3">
            The Riemann Hypothesis<br />Shortcut?
          </h2>
          <p className="text-white/70 text-[0.9375rem] max-w-[400px] leading-relaxed mb-8">
            Solve the partial differential equation for the flow of a frictionless fluid in a three-dimensional pipe.
          </p>
          <div className="absolute top-8 right-10 font-headline text-5xl font-extrabold text-primary opacity-90 leading-none max-md:hidden">
            +500<span className="block text-2xl">XP</span>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all">
              Begin Solving
            </button>
            <button className="px-8 py-3 bg-white/10 text-ink-on-dark font-headline font-bold rounded-xl hover:bg-white/15 active:scale-95 transition-all">
              View Leaderboard
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-ink-muted">schedule</span>
              <h3 className="font-headline text-lg font-bold">Recent Activity</h3>
            </div>
            <div className="flex flex-col gap-5">
              {[
                { icon: "check_circle", color: "primary", title: 'Completed "Limits at Infinity"', desc: "Earned 150 Mastery Points in Calculus I", time: "2 hours ago" },
                { icon: "lock_open", color: "secondary", title: "New Lesson Unlocked", desc: "Matrix Transformations available in Linear Algebra", time: "5 hours ago" },
                { icon: "emoji_events", color: "warning", title: 'Achieved "Vector Voyager"', desc: "Solved 10 consecutive matrix problems without error", time: "Yesterday" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    item.color === "primary" ? "bg-primary-light text-primary" :
                    item.color === "secondary" ? "bg-secondary-light text-secondary" :
                    "bg-warning-light text-[#8B6914]"
                  }`}>
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-[0.8125rem] text-ink-muted">{item.desc}</p>
                    <span className="text-xs text-primary font-medium mt-1 block">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="#" className="text-sm font-bold text-secondary hover:opacity-80 transition-opacity">View Full History →</a>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "calculate", label: "Solver" },
              { icon: "draw", label: "Whiteboard" },
            ].map((tile) => (
              <div key={tile.label} className="glass rounded-2xl p-5 flex flex-col items-center gap-3 shadow-glass cursor-pointer hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <span className="material-symbols-outlined text-3xl text-ink-muted">{tile.icon}</span>
                <span className="text-sm font-semibold">{tile.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
