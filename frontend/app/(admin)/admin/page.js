"use client";
import { useState, useEffect } from "react";
import { users as usersApi, sessions as sessionsApi, assignments as assignmentsApi, payments as paymentsApi, help } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    Promise.all([
      usersApi.list("?role=STUDENT&limit=1").catch(() => ({ pagination: { total: 0 } })),
      sessionsApi.list().catch(() => ({ sessions: [] })),
      assignmentsApi.list().catch(() => ({ assignments: [] })),
      paymentsApi.list().catch(() => ({ payments: [] })),
      help.list().catch(() => ({ helpRequests: [] })),
    ]).then(([u, s, a, p, h]) => {
      const sessions = s.sessions || [];
      const payments = p.payments || [];
      const helpReqs = h.helpRequests || [];
      const assignments = a.assignments || [];

      const totalRevenue = payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + (p.amount ?? 0), 0);
      const liveSessions = sessions.filter(s => s.status === "LIVE");
      const upcoming = sessions.filter(s => s.status === "UPCOMING");
      const pendingSubs = assignments.reduce((sum, a) => sum + (a._count?.submissions ?? 0), 0);

      setStats({
        students: u.pagination?.total ?? 0,
        sessionsThisMonth: sessions.length,
        live: liveSessions.length,
        pending: pendingSubs,
        revenue: totalRevenue,
      });

      setUpcomingSessions(upcoming.slice(0, 3));
      setRecentPayments(payments.slice(0, 5));
      setOpenTickets(helpReqs.filter(h => h.status === "OPEN").length);
    });
  }, []);

  const quickActions = [
    { icon: "add_circle", label: "Add Session", href: "/admin/sessions" },
    { icon: "assignment_add", label: "Create Assignment", href: "/admin/assignments" },
    { icon: "person_add", label: "Add Student", href: "/admin/users" },
    { icon: "assessment", label: "Generate Report", href: "/admin/reports" },
    { icon: "support_agent", label: "Help Tickets", href: "/admin/help", badge: openTickets },
    { icon: "quiz", label: "Quizzes", href: "/admin/sessions" },
  ];

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Overview of your platform — students, sessions, and revenue.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 stagger">
        {[
          {
            icon: "group", label: "Total Students",
            value: stats?.students ?? "—", trend: "Active learners",
            color: "text-secondary", bg: "bg-secondary-light"
          },
          {
            icon: "play_circle", label: "Sessions",
            value: stats?.sessionsThisMonth ?? "—",
            trend: stats?.live ? `🔴 ${stats.live} live now` : "No live sessions",
            color: "text-primary", bg: "bg-primary-light"
          },
          {
            icon: "support_agent", label: "Open Tickets",
            value: stats !== null ? openTickets : "—",
            trend: openTickets > 0 ? "Needs attention" : "All resolved",
            color: "text-danger", bg: "bg-danger-light"
          },
          {
            icon: "payments", label: "Total Revenue",
            value: stats !== null ? `$${(stats.revenue).toFixed(0)}` : "—",
            trend: "All time paid",
            color: "text-[#8B6914]", bg: "bg-warning-light"
          },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
            </div>
            <p className="font-headline text-3xl font-extrabold mb-1">
              {stats === null ? <span className="w-16 h-8 bg-surface-high rounded animate-pulse inline-block" /> : s.value}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
            <p className={`text-xs mt-1 font-semibold ${s.color}`}>{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href}
            className="glass rounded-2xl p-5 flex flex-col items-center gap-3 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center animate-fade-in-up relative">
            {a.badge > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-danger text-white text-[0.6rem] font-extrabold rounded-full flex items-center justify-center">
                {a.badge}
              </span>
            )}
            <span className="material-symbols-outlined text-3xl text-primary">{a.icon}</span>
            <span className="text-sm font-headline font-bold">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Recent Payments */}
        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span> Recent Payments
            </h3>
            <Link href="/admin/payments" className="text-sm font-bold text-secondary hover:opacity-70">View all →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="text-center text-ink-muted py-8">
              <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">receipt_long</span>
              <p className="font-semibold">No payments yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.type}</p>
                      <p className="text-xs text-ink-muted">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-bold text-primary">${(p.amount ?? 0).toFixed(2)}</p>
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${p.status === "PAID" ? "bg-primary-light text-primary" : p.status === "PENDING" ? "bg-warning-light text-[#8B6914]" : "bg-danger-light text-danger"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">upcoming</span> Upcoming
            </h3>
            <Link href="/admin/sessions" className="text-sm font-bold text-secondary hover:opacity-70">Manage →</Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center text-ink-muted py-8">
              <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">event</span>
              <p className="font-semibold">No upcoming sessions</p>
              <Link href="/admin/sessions" className="text-sm text-primary font-bold mt-1 block">+ Add one →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingSessions.map(s => (
                <div key={s.id} className="p-4 bg-surface-low rounded-xl">
                  <p className="font-headline font-bold text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-ink-muted">{new Date(s.scheduledAt).toLocaleString()}</p>
                  <p className="text-xs text-secondary font-semibold mt-1">{s._count?.enrollments ?? 0} enrolled</p>
                </div>
              ))}
              <Link href="/admin/sessions" className="text-sm font-bold text-secondary hover:opacity-70 transition-opacity text-center block mt-2">
                View all sessions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
