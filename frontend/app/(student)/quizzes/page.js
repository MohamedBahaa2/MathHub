"use client";
import { useState, useEffect } from "react";
import { quizzes as quizzesApi, getUser } from "@/lib/api";
import { useRouter } from "next/navigation";

const STATUS_ICONS = { functions: "functions", architecture: "architecture", grid_view: "grid_view", waves: "waves", quiz: "quiz" };
const COLORS = ["bg-primary-xlight text-primary", "bg-secondary-xlight text-secondary", "bg-surface-high text-ink-muted", "bg-warning-light text-[#8B6914]"];

export default function QuizzesPage() {
  const router = useRouter();
  const user = getUser();
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    quizzesApi.list()
      .then(d => setQuizList(d.quizzes || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleStart(quiz) {
    setStarting(quiz.id);
    try {
      await quizzesApi.startAttempt(quiz.id);
      router.push(`/quizzes/${quiz.id}`);
    } catch (err) {
      // If already has attempt, just navigate
      if (err.message?.includes("already have")) {
        router.push(`/quizzes/${quiz.id}`);
      } else {
        setError(err.message);
        setStarting(null);
      }
    }
  }

  const ICON_LIST = ["functions", "architecture", "grid_view", "waves", "quiz", "calculate"];

  return (
    <>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Quizzes</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Test your knowledge and track your performance across core mathematical disciplines.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        {[
          { icon: "format_list_numbered", label: "Total Quizzes", value: quizList.length },
          { icon: "quiz", label: "Published", value: quizList.filter(q => q.isPublished).length },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-3 bg-surface-low rounded-xl shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLORS[i]}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-headline text-xl font-extrabold">{loading ? "—" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-52 animate-pulse shadow-glass" />)}
        </div>
      ) : quizList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-ink-muted shadow-glass">
          <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">quiz</span>
          <p className="font-semibold">No quizzes published yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 stagger">
          {quizList.map((quiz, i) => {
            const icon = ICON_LIST[i % ICON_LIST.length];
            const colorClass = COLORS[i % COLORS.length];
            const questionCount = quiz._count?.questions ?? 0;

            return (
              <div key={quiz.id} className="glass rounded-2xl p-8 shadow-glass flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-400 animate-fade-in-up">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center ${colorClass}`}>
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-wide ${quiz.isPublished ? "bg-primary-light text-primary" : "bg-surface-high text-ink-muted"}`}>
                    {quiz.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <h3 className="font-headline text-xl font-bold mb-2">{quiz.title}</h3>
                {quiz.description && <p className="text-sm text-ink-muted mb-4 leading-relaxed flex-1">{quiz.description}</p>}

                <div className="flex gap-6 mb-6">
                  <span className="flex items-center gap-2 text-sm text-ink-muted font-medium">
                    <span className="material-symbols-outlined text-lg">format_list_numbered</span>
                    {questionCount} Questions
                  </span>
                  {quiz.session?.title && (
                    <span className="flex items-center gap-2 text-sm text-ink-muted font-medium truncate">
                      <span className="material-symbols-outlined text-lg">play_circle</span>
                      <span className="truncate">{quiz.session.title}</span>
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  {quiz.isPublished ? (
                    <button
                      onClick={() => handleStart(quiz)}
                      disabled={starting === quiz.id}
                      className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {starting === quiz.id && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {starting === quiz.id ? "Loading…" : "Begin Assessment"}
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-surface-high text-ink-muted font-headline font-bold rounded-2xl text-center">
                      Not yet available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
