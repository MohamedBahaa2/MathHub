export const metadata = { title: "MathHub Admin — Dashboard" };

const stats = [
  { icon: "group", label: "Total Students", value: "42", trend: "+3 this month", color: "text-secondary", bg: "bg-secondary-light" },
  { icon: "play_circle", label: "Sessions This Month", value: "8", trend: "2 live, 6 recorded", color: "text-primary", bg: "bg-primary-light" },
  { icon: "assignment", label: "Pending Reviews", value: "11", trend: "4 urgent", color: "text-danger", bg: "bg-danger-light" },
  { icon: "payments", label: "Revenue MTD", value: "$1,218", trend: "+12% vs last month", color: "text-[#8B6914]", bg: "bg-warning-light" },
];

const quickActions = [
  { icon: "add_circle", label: "Add Session", href: "/admin/sessions" },
  { icon: "assignment_add", label: "Create Assignment", href: "/admin/assignments" },
  { icon: "person_add", label: "Add Student", href: "/admin/users" },
  { icon: "assessment", label: "Generate Report", href: "/admin/reports" },
];

const recentActivity = [
  { icon: "grade", text: "Graded Riemann Sum Integrals for Sara M.", time: "10 min ago", color: "bg-primary-light text-primary" },
  { icon: "play_circle", text: 'Session "Linear Algebra — Eigenvalues" went live', time: "2 hours ago", color: "bg-danger-light text-danger" },
  { icon: "person_add", text: "New student registered: Karim Ahmed", time: "Yesterday", color: "bg-secondary-light text-secondary" },
  { icon: "payments", text: "Payment received from Omar Sayed — $29", time: "Yesterday", color: "bg-warning-light text-[#8B6914]" },
];

const upcomingSessions = [
  { title: "Calculus I — Limits", date: "June 28 · 6:00 PM", enrolled: 18, status: "UPCOMING" },
  { title: "Statistics — Probability", date: "July 5 · 6:00 PM", enrolled: 14, status: "UPCOMING" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Overview of your platform — students, sessions, and revenue.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 stagger">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
            </div>
            <p className="font-headline text-3xl font-extrabold mb-1">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
            <p className={`text-xs mt-1 font-semibold ${s.color}`}>{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((a) => (
          <a key={a.label} href={a.href} className="glass rounded-2xl p-5 flex flex-col items-center gap-3 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center animate-fade-in-up">
            <span className="material-symbols-outlined text-3xl text-primary">{a.icon}</span>
            <span className="text-sm font-headline font-bold">{a.label}</span>
          </a>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span> Recent Activity
          </h3>
          <div className="flex flex-col gap-4">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${a.color}`}>
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.text}</p>
                  <p className="text-xs text-ink-muted">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upcoming</span> Upcoming Sessions
          </h3>
          <div className="flex flex-col gap-3">
            {upcomingSessions.map((s, i) => (
              <div key={i} className="p-4 bg-surface-low rounded-xl">
                <p className="font-headline font-bold text-sm mb-1">{s.title}</p>
                <p className="text-xs text-ink-muted">{s.date}</p>
                <p className="text-xs text-secondary font-semibold mt-1">{s.enrolled} enrolled</p>
              </div>
            ))}
            <a href="/admin/sessions" className="text-sm font-bold text-secondary hover:opacity-70 transition-opacity text-center block mt-2">View all sessions →</a>
          </div>
        </div>
      </div>
    </>
  );
}
