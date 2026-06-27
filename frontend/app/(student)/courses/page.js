"use client";
import { useState, useEffect } from "react";
import { courses as coursesApi, sessions as sessionsApi, payments as paymentsApi } from "@/lib/api";

function CourseModal({ course, enrolledCourseIds, enrolledSessionIds, onClose }) {
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState("");

  const isCourseEnrolled = enrolledCourseIds.has(course.id);

  async function handleBuy(type, itemId) {
    setBuying(itemId); setError("");
    try {
      const payload = type === "COURSE" ? { type: "COURSE", courseId: itemId } : { type: "SESSION", sessionId: itemId };
      const d = await paymentsApi.initiate(payload);
      if (d.paymentUrl) {
        window.location.href = d.paymentUrl;
      } else {
        // Fallback for FREE courses or direct enrollments
        window.location.href = "/sessions";
      }
    } catch (err) {
      setError(err.message);
      setBuying(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[640px] flex flex-col max-h-[90vh] my-4 animate-fade-in-up">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-surface-high/50 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="pr-4">
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-primary-light text-primary text-[0.625rem] font-bold uppercase tracking-widest">
                Course
              </span>
              <h2 className="font-headline text-3xl font-extrabold mb-2">{course.name}</h2>
              <p className="text-ink-muted text-sm leading-relaxed">{course.description || "No description provided."}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high bg-surface-low shadow-sm shrink-0">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="mt-6 flex items-center gap-4 relative z-10">
            {isCourseEnrolled ? (
              <div className="flex-1 py-3.5 bg-surface-high text-ink-muted font-headline font-bold rounded-xl text-center flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Already Enrolled
              </div>
            ) : (
              <button onClick={() => handleBuy("COURSE", course.id)} disabled={buying === course.id}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60">
                {buying === course.id ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">shopping_cart</span>}
                {buying === course.id ? "Processing…" : `Buy Full Course for $${course.coursePrice}`}
              </button>
            )}
          </div>
          {error && buying === course.id && <div className="mt-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm relative z-10">{error}</div>}
        </div>

        {/* Sessions List */}
        <div className="p-8 overflow-y-auto">
          <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">play_circle</span>
            Included Sessions ({course.sessions?.length || 0})
          </h3>
          <div className="flex flex-col gap-3">
            {course.sessions?.map(s => {
              const isSessionEnrolled = isCourseEnrolled || enrolledSessionIds.has(s.id);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-surface-high/50 bg-surface-low/30 hover:bg-surface-low transition-colors">
                  <div>
                    <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted mb-1 block">{s.topic}</span>
                    <h4 className="font-headline font-bold text-base mb-1">{s.title}</h4>
                    <span className="text-xs text-ink-muted flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(s.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    {!isSessionEnrolled && course.sessionPrice > 0 && (
                      <span className="text-sm font-bold text-primary">${course.sessionPrice}</span>
                    )}
                    {isSessionEnrolled ? (
                      <span className="px-3 py-1.5 bg-surface-high text-ink-muted rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">check</span> Enrolled
                      </span>
                    ) : course.sessionPrice > 0 ? (
                      <button onClick={() => handleBuy("SESSION", s.id)} disabled={buying === s.id}
                        className="px-4 py-2 bg-secondary-light text-secondary font-bold rounded-lg text-xs hover:brightness-95 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
                        {buying === s.id ? <span className="w-3 h-3 border border-secondary/30 border-t-secondary rounded-full animate-spin" /> : "Buy Session"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {(!course.sessions || course.sessions.length === 0) && (
              <div className="text-center py-6 text-ink-muted text-sm border border-dashed border-surface-high rounded-xl">
                No sessions scheduled for this course yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentCoursesPage() {
  const [coursesList, setCoursesList] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [enrolledSessionIds, setEnrolledSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewCourse, setViewCourse] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, sRes] = await Promise.all([coursesApi.list(), sessionsApi.list()]);
        const activeCourses = (cRes.courses || []).filter(c => c.isActive);
        setCoursesList(activeCourses);
        
        const mySessions = sRes.sessions || [];
        setEnrolledCourseIds(new Set(mySessions.map(s => s.course?.id).filter(Boolean)));
        setEnrolledSessionIds(new Set(mySessions.map(s => s.id)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleOpenCourse(courseId) {
    try {
      const c = await coursesApi.get(courseId);
      setViewCourse(c.course);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Explore Courses</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Browse our course catalog, unlock new modules, and expand your learning journey.
        </p>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm font-medium">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-[280px] animate-pulse shadow-glass" />)}
        </div>
      ) : coursesList.length === 0 ? (
        <div className="text-center py-20 text-ink-muted glass rounded-2xl">
          <span className="material-symbols-outlined text-5xl mb-4 block">school</span>
          <p className="font-headline font-bold text-lg">No courses available right now</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger">
          {coursesList.map(c => {
            const isEnrolled = enrolledCourseIds.has(c.id);
            return (
              <div key={c.id} className="glass rounded-2xl overflow-hidden shadow-glass hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 flex flex-col relative group cursor-pointer"
                onClick={() => handleOpenCourse(c.id)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors" />
                
                <div className="p-6 flex flex-col flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                    </div>
                    {isEnrolled ? (
                      <span className="px-2.5 py-1 bg-surface-high text-ink-muted rounded-full text-[0.625rem] font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span> Enrolled
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-extrabold font-headline">
                        ${c.coursePrice}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-headline font-extrabold text-xl leading-tight mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
                  <p className="text-sm text-ink-muted line-clamp-2 mb-6">{c.description || "No description provided."}</p>
                  
                  <div className="mt-auto flex items-center gap-4 text-xs font-bold text-ink-muted">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-high">
                      <span className="material-symbols-outlined text-[14px]">play_circle</span>
                      {c._count?.sessions ?? 0} Sessions
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-high">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {c._count?.enrollments ?? 0} Students
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewCourse && (
        <CourseModal
          course={viewCourse}
          enrolledCourseIds={enrolledCourseIds}
          enrolledSessionIds={enrolledSessionIds}
          onClose={() => setViewCourse(null)}
        />
      )}
    </>
  );
}
