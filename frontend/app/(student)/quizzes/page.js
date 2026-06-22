export const metadata = {
  title: "MathHub — Quizzes",
  description: "Test your mathematical knowledge with quizzes across calculus, algebra, and more.",
};

export default function QuizzesPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Quizzes</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Test your knowledge and track your performance across core mathematical disciplines.</p>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        {[
          { icon: "trending_up", label: "Average Score", value: "84%", colors: "bg-primary-light text-primary" },
          { icon: "timer", label: "Time Invested", value: "12.5h", colors: "bg-danger-light text-danger" },
          { icon: "verified", label: "Quizzes Passed", value: "18", colors: "bg-secondary-light text-secondary" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-3 bg-surface-low rounded-xl shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.colors}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-headline text-xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger">

        {/* Quiz 1 — Not Started */}
        <div className="glass rounded-2xl p-8 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="w-[52px] h-[52px] rounded-2xl bg-primary-xlight text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">functions</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-high text-ink-muted text-[0.6875rem] font-bold uppercase tracking-wide">Not Started</span>
          </div>
          <h3 className="font-headline text-xl font-bold mb-4">Quiz 1: Calculus</h3>
          <div className="flex gap-6 mb-6">
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">schedule</span> 45 mins</span>
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">format_list_numbered</span> 20 Questions</span>
          </div>
          <div className="mt-auto">
            <button className="w-full py-4 bg-surface-highest text-primary font-headline font-bold rounded-2xl hover:bg-gradient-to-br hover:from-primary hover:to-primary-container hover:text-white active:scale-95 transition-all duration-300">Begin Assessment</button>
          </div>
        </div>

        {/* Quiz 2 — In Progress */}
        <div className="glass rounded-2xl p-8 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="w-[52px] h-[52px] rounded-2xl bg-secondary-xlight text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">architecture</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-secondary-light text-secondary text-[0.6875rem] font-bold uppercase tracking-wide">In Progress</span>
          </div>
          <h3 className="font-headline text-xl font-bold mb-4">Quiz 2: Calculus II</h3>
          <div className="flex gap-6 mb-6">
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">schedule</span> 60 mins</span>
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">format_list_numbered</span> 25 Questions</span>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-ink-muted">Completion</span>
              <span className="text-secondary">40%</span>
            </div>
            <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: "40%" }} />
            </div>
          </div>
          <div className="mt-auto">
            <button className="w-full py-4 bg-secondary text-ink-on-primary font-headline font-bold rounded-2xl shadow-teal hover:bg-secondary-hover active:scale-95 transition-all">Resume Quiz</button>
          </div>
        </div>

        {/* Quiz 3 — Completed */}
        <div className="glass rounded-2xl p-8 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="w-[52px] h-[52px] rounded-2xl bg-primary-light text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">grid_view</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-[0.6875rem] font-bold uppercase tracking-wide">Completed</span>
          </div>
          <h3 className="font-headline text-xl font-bold mb-4">Quiz 3: Linear Algebra</h3>
          <div className="flex gap-6 mb-6">
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">schedule</span> 30 mins</span>
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">format_list_numbered</span> 15 Questions</span>
          </div>
          <div className="p-4 bg-surface-low rounded-2xl mb-6">
            <p className="text-[0.625rem] font-bold uppercase tracking-wide text-ink-muted mb-1">Final Performance</p>
            <span className="font-headline text-3xl font-extrabold text-primary">88</span>
            <span className="text-base font-medium text-ink-muted"> / 100</span>
          </div>
          <div className="mt-auto">
            <button className="w-full py-4 bg-surface-highest text-primary font-headline font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white active:scale-95 transition-all duration-300">
              <span className="material-symbols-outlined text-lg">visibility</span> Review Answers
            </button>
          </div>
        </div>

        {/* Quiz 4 — Not Started */}
        <div className="glass rounded-2xl p-8 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="w-[52px] h-[52px] rounded-2xl bg-surface-high text-ink-muted flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">waves</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-high text-ink-muted text-[0.6875rem] font-bold uppercase tracking-wide">Not Started</span>
          </div>
          <h3 className="font-headline text-xl font-bold mb-4">Quiz 4: Differential Equations</h3>
          <div className="flex gap-6 mb-6">
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">schedule</span> 50 mins</span>
            <span className="flex items-center gap-2 text-sm text-ink-muted font-medium"><span className="material-symbols-outlined text-lg">format_list_numbered</span> 22 Questions</span>
          </div>
          <div className="mt-auto">
            <button className="w-full py-4 bg-surface-highest text-primary font-headline font-bold rounded-2xl hover:bg-gradient-to-br hover:from-primary hover:to-primary-container hover:text-white active:scale-95 transition-all duration-300">Begin Assessment</button>
          </div>
        </div>

        {/* Locked */}
        <div className="bg-surface-low border-2 border-dashed border-black/12 rounded-2xl flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-ink-muted mb-4">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h4 className="font-headline text-lg font-bold text-ink-muted mb-2">Discrete Mathematics</h4>
          <p className="text-sm text-ink-muted max-w-[200px]">Unlock this assessment by completing the logic module.</p>
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-ink-on-primary rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(144,51,17,0.3)] hover:scale-110 active:scale-95 transition-all z-50" aria-label="Help">
        <span className="material-symbols-outlined text-3xl">live_help</span>
      </button>
    </>
  );
}
