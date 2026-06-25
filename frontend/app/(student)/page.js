"use client";
import { useState, useEffect } from "react";
import { sessions as sessionsApi, quizzes as quizzesApi, assignments as assignmentsApi, getUser } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      sessionsApi.list().catch(() => ({ sessions: [] })),
      assignmentsApi.list().catch(() => ({ assignments: [] })),
      quizzesApi.list().catch(() => ({ quizzes: [] })),
    ]).then(([s, a, q]) => {
      setStats({
        sessions: s.sessions || [],
        assignments: a.assignments || [],
        quizzes: q.quizzes || [],
      });
    });
  }, []);

  const upcoming = stats?.sessions.filter(s => s.status === "UPCOMING").length ?? 0;
  const live = stats?.sessions.filter(s => s.status === "LIVE").length ?? 0;
  const pending = stats?.assignments.filter(a => !a.submissions?.length).length ?? 0;

  const firstName = user?.name?.split(" ")[0] ?? "Scholar";
  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <>
      {/* Welcome */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight">Welcome back, {firstName}.</h1>
        <p className="text-ink-muted text-base mt-1">
          {live > 0 ? `🔴 ${live} session live right now!` : `${upcoming} upcoming session${upcoming !== 1 ? "s" : ""} this week.`}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "play_circle", label: "Sessions", value: stats?.sessions.length ?? "—", color: "text-primary", bg: "bg-primary-light", href: "/sessions" },
          { icon: "assignment", label: "Assignments", value: stats?.assignments.length ?? "—", color: "text-secondary", bg: "bg-secondary-light", href: "/assignments" },
          { icon: "quiz", label: "Quizzes", value: stats?.quizzes.length ?? "—", color: "text-ink-muted", bg: "bg-surface-high", href: "/quizzes" },
        ].map(s => (
          <Link key={s.label} href={s.href} className="glass rounded-2xl p-6 shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-headline text-2xl font-extrabold">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 stagger">
        {/* Upcoming Sessions */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">upcoming</span>
            <h2 className="font-headline text-xl font-bold">Your Sessions</h2>
          </div>
          {!stats ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-low rounded-xl animate-pulse" />)}
            </div>
          ) : stats.sessions.length === 0 ? (
            <div className="text-center text-ink-muted py-8">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">video_library</span>
              <p className="font-semibold">No sessions enrolled yet</p>
              <Link href="/sessions" className="text-sm text-primary font-bold mt-2 block hover:opacity-70">Browse sessions →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-surface-low rounded-xl hover:bg-surface-high transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === "LIVE" ? "bg-danger animate-pulse" : s.status === "RECORDING" ? "bg-secondary" : "bg-ink-muted"}`} />
                    <div>
                      <p className="font-headline font-bold text-sm">{s.title}</p>
                      <p className="text-xs text-ink-muted">{new Date(s.scheduledAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link href={`/sessions/${s.id}`} className="text-xs font-bold text-primary hover:opacity-70">
                    {s.status === "LIVE" ? "Join →" : s.status === "RECORDING" ? "Watch →" : "View →"}
                  </Link>
                </div>
              ))}
              <Link href="/sessions" className="text-sm font-bold text-secondary hover:opacity-70 transition-opacity text-center block mt-2">View all sessions →</Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">bolt</span>
              <h3 className="font-headline text-lg font-bold">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "quiz", label: "Take Quiz", href: "/quizzes" },
                { icon: "assignment", label: "Assignments", href: "/assignments" },
                { icon: "support_agent", label: "Get Help", href: "/help" },
                { icon: "analytics", label: "Analytics", href: "/analytics" },
              ].map(a => (
                <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 bg-surface-low rounded-xl hover:bg-surface-high hover:-translate-y-0.5 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-2xl text-primary">{a.icon}</span>
                  <span className="text-xs font-semibold text-center">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass rounded-2xl p-5 shadow-glass animate-fade-in-up flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-ink-on-primary font-extrabold text-sm ring-2 ring-primary-light shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold truncate">{user?.name ?? "Student"}</p>
              <p className="text-xs text-ink-muted truncate">{user?.email ?? ""}</p>
              {user?.studentCode && <p className="text-xs text-primary font-mono mt-0.5">{user.studentCode}</p>}
            </div>
            <Link href="/settings" className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-high transition-colors">
              <span className="material-symbols-outlined text-lg">settings</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
