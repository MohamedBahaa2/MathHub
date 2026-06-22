"use client";

import Link from "next/link";

const session = {
  id: "3",
  title: "Calculus II — Integration Techniques",
  topic: "Calculus",
  date: "June 18, 2025",
  duration: "80 min",
  status: "RECORDING",
  instructor: "Mr. Ahmed Bahaa",
  description: "Deep dive into advanced integration techniques including integration by parts, trigonometric substitution, and partial fractions.",
  chapters: [
    { title: "Introduction to Advanced Integration", time: "0:00", done: true },
    { title: "Integration by Parts", time: "12:30", done: true },
    { title: "Trigonometric Substitution", time: "28:45", done: false },
    { title: "Partial Fractions", time: "48:10", done: false },
    { title: "Practice Problems", time: "65:00", done: false },
  ],
  comments: [
    { author: "Sara M.", avatar: "S", time: "2 days ago", text: "The integration by parts section was really clear! Can you show more examples with definite integrals?" },
    { author: "Karim A.", avatar: "K", time: "1 day ago", text: "At 28:45 the substitution step confused me, is t = sin(x) or t = cos(x)?" },
  ],
};

export default function SessionDetailPage({ params }) {
  const isLive = session.status === "LIVE";
  const isRecording = session.status === "RECORDING";
  const studentId = "STU-20241108";
  const studentName = "Ahmed";

  return (
    <>
      {/* Back */}
      <div className="mb-6 animate-fade-in-up">
        <Link href="/sessions" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary transition-colors font-semibold">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Sessions
        </Link>
      </div>

      {isLive && (
        <div className="max-w-[700px] mx-auto text-center animate-fade-in-up">
          {/* Live badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-danger-light text-danger font-bold rounded-full mb-6 text-sm">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-live" /> LIVE NOW
          </span>
          <h1 className="font-headline text-3xl font-extrabold mb-3">{session.title}</h1>
          <p className="text-ink-muted mb-8">{session.description}</p>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-br from-danger to-[#C62828] text-white font-headline font-bold text-lg rounded-2xl shadow-lg hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">video_call</span>
            Join on Zoom
          </a>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[{ icon: "person", label: "Instructor", value: session.instructor }, { icon: "schedule", label: "Duration", value: session.duration }, { icon: "calendar_today", label: "Date", value: session.date }].map((m) => (
              <div key={m.label} className="glass rounded-2xl p-4 shadow-glass">
                <span className="material-symbols-outlined text-primary mb-1 block">{m.icon}</span>
                <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">{m.label}</p>
                <p className="font-headline font-bold text-sm mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isRecording && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 animate-fade-in-up">
          {/* Left: Player + Watermark */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-ink aspect-video mb-6 shadow-elevated">
              {/* Zoom recording iframe placeholder */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink to-[#2D2D2D]">
                <span className="material-symbols-outlined text-7xl text-white/20">smart_display</span>
                <p className="absolute text-white/40 text-sm mt-20">Recording loads from Zoom via backend token</p>
              </div>
              {/* Watermark overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ zIndex: 10 }}
              >
                <div
                  className="text-white font-bold text-base opacity-15 select-none"
                  style={{
                    transform: "rotate(-35deg)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    whiteSpace: "nowrap",
                    fontSize: "clamp(0.75rem, 2vw, 1.1rem)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {studentName} · {studentId} · MathHub
                </div>
              </div>
            </div>

            {/* Session info */}
            <div className="glass rounded-2xl p-6 shadow-glass mb-6">
              <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted">{session.topic}</span>
              <h1 className="font-headline text-2xl font-extrabold mt-1 mb-2">{session.title}</h1>
              <p className="text-sm text-ink-muted leading-relaxed mb-4">{session.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span>{session.instructor}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span>{session.date}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{session.duration}</span>
              </div>
            </div>

            {/* Comments */}
            <div className="glass rounded-2xl p-6 shadow-glass">
              <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">forum</span> Q&amp;A / Comments
              </h3>
              <div className="flex flex-col gap-4 mb-6">
                {session.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-light text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                      {c.avatar}
                    </div>
                    <div className="flex-1 bg-surface-low rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-headline font-bold text-sm">{c.author}</span>
                        <span className="text-xs text-ink-muted">{c.time}</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-ink-on-primary font-bold text-sm shrink-0">A</div>
                <input
                  type="text"
                  placeholder="Ask a question about this session..."
                  className="flex-1 px-4 py-2.5 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all"
                />
                <button className="px-5 py-2.5 bg-primary text-ink-on-primary font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all">
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Right: Chapter Outline */}
          <div className="glass rounded-2xl p-5 shadow-glass h-fit lg:sticky lg:top-20">
            <h3 className="font-headline font-bold text-base mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">format_list_bulleted</span> Session Outline
            </h3>
            <div className="flex flex-col gap-1">
              {session.chapters.map((ch, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${ch.done ? "hover:bg-primary-xlight" : "hover:bg-surface-high"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${ch.done ? "bg-primary-light text-primary" : "bg-surface-high text-ink-muted"}`}>
                    {ch.done ? <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : <span className="text-[0.625rem] font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug ${ch.done ? "text-ink" : "text-ink-muted"}`}>{ch.title}</p>
                    <p className="text-[0.625rem] text-ink-muted mt-0.5">{ch.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
