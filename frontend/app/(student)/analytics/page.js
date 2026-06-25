"use client";
import { useState, useEffect } from "react";
import { assignments as assignmentsApi, quizzes as quizzesApi, getUser } from "@/lib/api";

export default function AnalyticsPage() {
  const user = getUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      assignmentsApi.list().catch(() => ({ assignments: [] })),
      quizzesApi.list().catch(() => ({ quizzes: [] })),
    ]).then(([a, q]) => {
      const assignments = a.assignments || [];
      const quizList = q.quizzes || [];
      // Compute from real data
      const gradedSubs = assignments.flatMap(a => a.submissions ?? []).filter(s => s.grade != null);
      const avgGrade = gradedSubs.length > 0
        ? (gradedSubs.reduce((sum, s) => sum + s.grade, 0) / gradedSubs.length).toFixed(1)
        : null;
      setData({ assignments, quizList, gradedSubs, avgGrade });
    });
  }, []);

  const topics = [
    { name: "Sessions Enrolled", value: 100, color: "primary" },
    { name: "Assignments Submitted", value: data ? Math.min(100, ((data.gradedSubs.length / Math.max(data.assignments.length, 1)) * 100).toFixed(0)) : 0, color: "secondary" },
    { name: "Quizzes Available", value: data ? Math.min(100, data.quizList.length * 10) : 0, color: "danger" },
  ];

  const avgGradeNum = parseFloat(data?.avgGrade ?? 0);
  const ringOffset = (502.6 * (1 - avgGradeNum / 100)).toFixed(1);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 animate-fade-in-up">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-primary mb-1">Student Analytics</p>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Cognitive Trajectory</h1>
          <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
            Real-time intelligence dashboard tracking your mathematical growth.
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 stagger">

        {/* Grade Velocity */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">Assignment Performance</h3>
              <p className="text-sm text-ink-muted">Your graded submissions</p>
            </div>
            <span className="material-symbols-outlined text-ink-muted">trending_up</span>
          </div>
          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-headline text-6xl font-extrabold leading-none">
              {data?.avgGrade ?? "—"}
            </span>
            <span className="text-lg font-semibold text-ink-muted">Avg. Score</span>
          </div>
          {data?.gradedSubs.length === 0 ? (
            <div className="text-center text-ink-muted py-8 bg-surface-low rounded-xl">
              <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">assignment</span>
              <p className="font-semibold text-sm">No graded submissions yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data.assignments.slice(0, 5).map(a => {
                const sub = (a.submissions ?? []).find(s => s.studentId === user?.id);
                if (!sub?.grade) return null;
                return (
                  <div key={a.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold truncate">{a.title}</span>
                        <span className="text-sm font-bold text-primary ml-4">{sub.grade}/100</span>
                      </div>
                      <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${sub.grade}%` }} />
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>

        {/* Completion Ring */}
        <div className="col-span-12 lg:col-span-4 glass rounded-2xl p-8 shadow-glass flex flex-col items-center justify-center text-center animate-fade-in-up">
          <h3 className="font-headline text-xl font-bold mb-1">Average Score</h3>
          <p className="text-sm text-ink-muted mb-6">Based on graded assignments</p>
          <div className="relative w-[180px] h-[180px] flex items-center justify-center mb-6">
            <svg viewBox="0 0 192 192" className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="80" fill="transparent" className="stroke-surface-high" strokeWidth="10" />
              <circle cx="96" cy="96" r="80" fill="transparent" className="stroke-primary" strokeWidth="10"
                strokeLinecap="round" strokeDasharray="502.6"
                strokeDashoffset={data?.avgGrade ? ringOffset : "502.6"}
                style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-headline text-4xl font-extrabold">{data?.avgGrade ?? "—"}</span>
              <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-ink-muted">
                {data?.avgGrade ? "Score" : "No data"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-3 bg-surface-low rounded-2xl text-left">
              <p className="text-[0.5625rem] font-bold uppercase text-ink-muted">Graded</p>
              <p className="text-lg font-bold">{data?.gradedSubs.length ?? "—"}</p>
            </div>
            <div className="p-3 bg-surface-low rounded-2xl text-left">
              <p className="text-[0.5625rem] font-bold uppercase text-ink-muted">Total</p>
              <p className="text-lg font-bold">{data?.assignments.length ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Topic Performance */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h3 className="font-headline text-xl font-bold mb-1">Platform Summary</h3>
          <p className="text-sm text-ink-muted mb-8">Your engagement across activities</p>
          <div className="flex flex-col gap-5">
            {[
              { name: "Assignments", value: data?.assignments.length ?? 0, max: Math.max(data?.assignments.length ?? 1, 1), color: "primary" },
              { name: "Graded Submissions", value: data?.gradedSubs.length ?? 0, max: Math.max(data?.assignments.length ?? 1, 1), color: "secondary" },
              { name: "Quizzes Available", value: data?.quizList.length ?? 0, max: Math.max(data?.quizList.length ?? 1, 1), color: "danger" },
            ].map((t, i) => {
              const pct = t.max > 0 ? Math.round((t.value / t.max) * 100) : 0;
              return (
                <div key={i} className="cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">{t.name}</span>
                    <span className={`text-sm font-bold text-${t.color}`}>{t.value}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 group-hover:brightness-110 bg-${t.color}`}
                      style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intelligence Insights */}
        <div className="col-span-12 lg:col-span-4 bg-secondary text-ink-on-primary rounded-2xl p-8 shadow-teal relative overflow-hidden animate-fade-in-up">
          <div className="absolute -top-5 -right-5 w-[120px] h-[120px] bg-white/8 rounded-full" />
          <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            Quick Stats
          </h3>
          <div className="flex flex-col gap-4">
            {[
              { label: "Assignments", val: data?.assignments.length ?? "—" },
              { label: "Graded", val: data?.gradedSubs.length ?? "—" },
              { label: "Avg. Score", val: data?.avgGrade ? `${data.avgGrade}%` : "—" },
              { label: "Quizzes", val: data?.quizList.length ?? "—" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm opacity-80">{item.label}</span>
                <span className="font-headline font-extrabold">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Graded Assignments */}
        <div className="col-span-12 glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <h3 className="font-headline text-lg font-bold mb-6">Recent Graded Submissions</h3>
          {!data || data.gradedSubs.length === 0 ? (
            <div className="text-center text-ink-muted py-8">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">grade</span>
              <p className="font-semibold">No graded submissions yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-black/5">
              {data.gradedSubs.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold font-headline shrink-0 ${s.grade >= 80 ? "bg-primary-light text-primary" : s.grade >= 60 ? "bg-warning-light text-[#8B6914]" : "bg-danger-light text-danger"}`}>
                    {s.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">Submission</h4>
                    <p className="text-[0.6875rem] text-ink-muted uppercase tracking-wide mt-0.5">
                      {s.gradedAt ? new Date(s.gradedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.grade >= 80 ? "bg-primary-light text-primary" : s.grade >= 60 ? "bg-warning-light text-[#8B6914]" : "bg-danger-light text-danger"}`}>
                    {s.grade}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
