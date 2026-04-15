export const metadata = {
  title: "MathHub — Live Sessions",
  description: "Join live math sessions, interact with instructors in real-time, and reserve upcoming masterclasses.",
};

const upcoming = [
  { level: "Advanced", levelColor: "text-primary", title: "Advanced Calculus Q&A: Stokes' Theorem", date: "Tomorrow, 10:00 AM", duration: "90 Minutes", instructor: "Prof. Elena Markov", icon: "school" },
  { level: "Intermediate", levelColor: "text-secondary", title: "Linear Algebra Workshop: Eigenvalues", date: "Oct 24, 02:00 PM", duration: "120 Minutes", instructor: "Dr. Marcus Chen", icon: "grid_view" },
  { level: "Beginner", levelColor: "text-ink-muted", title: "Foundations: Probability & Logic", date: "Oct 25, 09:00 AM", duration: "60 Minutes", instructor: "Sarah Jenkins, M.Sc.", icon: "casino" },
];

export default function LiveSessionsPage() {
  return (
    <>
      {/* Hero Banner */}
      <div className="relative w-full aspect-[21/9] max-md:aspect-video rounded-2xl overflow-hidden mb-12 shadow-elevated animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent flex flex-col justify-center p-8 lg:p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger text-white text-[0.625rem] font-bold uppercase tracking-[0.15em] rounded-full w-fit mb-4 animate-pulse-live">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            Live Now
          </div>
          <h2 className="font-headline text-3xl lg:text-[2.75rem] font-extrabold text-white leading-tight mb-4 tracking-tight">
            Complex Analysis:<br />The Riemann Hypothesis
          </h2>
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-white/90 font-medium">
              <div className="w-8 h-8 rounded-full bg-surface-high border border-white/20 flex items-center justify-center text-ink-muted text-xs font-bold">JT</div>
              <span>Dr. Julian Thorne</span>
            </div>
            <span className="flex items-center gap-1 text-white/60 text-sm">
              <span className="material-symbols-outlined text-base">group</span> 2.4k Students
            </span>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Join Live Session
            </button>
            <button className="px-8 py-3 bg-white/10 text-white font-headline font-bold rounded-xl border border-white/15 backdrop-blur-sm hover:bg-white/15 active:scale-95 transition-all">
              View Syllabus
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="font-headline text-2xl font-bold tracking-tight">Upcoming Sessions</h3>
            <p className="text-ink-muted mt-1">Reserve your seat for our masterclasses</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-high text-ink-muted hover:bg-surface-highest transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-ink-on-primary shadow-primary hover:brightness-110 transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger">
          {upcoming.map((s, i) => (
            <div key={i} className="glass rounded-2xl p-6 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
              <div className="w-full aspect-video rounded-xl bg-surface-high mb-5 relative flex items-center justify-center overflow-hidden">
                <span className={`absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[0.5625rem] font-bold uppercase tracking-wide ${s.levelColor}`}>
                  {s.level}
                </span>
                <span className="material-symbols-outlined text-5xl text-ink-muted/30">{s.icon}</span>
              </div>
              <h4 className="font-headline text-lg font-bold mb-3 leading-snug">{s.title}</h4>
              <div className="flex flex-col gap-2 mb-6 flex-1">
                {[
                  { icon: "calendar_today", text: s.date },
                  { icon: "schedule", text: s.duration },
                  { icon: "person", text: s.instructor },
                ].map((d, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-ink-muted font-medium">
                    <span className="material-symbols-outlined text-base">{d.icon}</span>{d.text}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-auto">
                <button className="px-6 py-2.5 bg-surface-highest text-primary font-headline font-bold text-sm rounded-xl hover:bg-primary hover:text-ink-on-primary active:scale-95 transition-all duration-300">
                  Register
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Stats */}
      <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6 stagger">
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <p className="text-ink-muted font-medium mb-1">Global Active Learners</p>
          <h5 className="font-headline text-4xl font-extrabold text-primary tracking-tight">128,402</h5>
          <p className="flex items-center gap-1 text-xs font-bold text-secondary mt-2">
            <span className="material-symbols-outlined text-sm">trending_up</span> +12% this week
          </p>
        </div>
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <p className="text-ink-muted font-medium mb-1">Pass Rate</p>
          <h5 className="font-headline text-3xl font-extrabold tracking-tight">94%</h5>
          <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden mt-4">
            <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(144,51,17,0.4)]" style={{ width: "94%" }} />
          </div>
        </div>
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up" style={{ background: "linear-gradient(135deg, rgba(40,84,116,0.08), transparent)" }}>
          <p className="text-ink-muted font-medium mb-1">Mentors</p>
          <h5 className="font-headline text-3xl font-extrabold text-secondary tracking-tight">450+</h5>
          <p className="text-xs text-ink-muted mt-2">World-class educators</p>
        </div>
      </section>
    </>
  );
}
