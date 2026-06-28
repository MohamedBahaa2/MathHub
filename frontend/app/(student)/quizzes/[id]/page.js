"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { quizzes as quizzesApi } from "@/lib/api";

export default function QuizAttemptPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await quizzesApi.get(id);
        if (!active) return;
        const loadedQuiz = data.quiz;
        let loadedAttempt = loadedQuiz.attempts?.[0] ?? null;
        if (!loadedAttempt) {
          const started = await quizzesApi.startAttempt(id);
          loadedAttempt = started.attempt;
        }
        const restored = {};
        for (const answer of loadedAttempt.answers ?? []) {
          restored[answer.questionId] = {
            choiceId: answer.choiceId ?? "",
            textAnswer: answer.textAnswer ?? "",
            mediaUrl: answer.mediaUrl ?? "",
          };
        }
        setQuiz(loadedQuiz);
        setAttempt(loadedAttempt);
        setAnswers(restored);
      } catch (err) {
        if (active) setError(err.message || "Unable to load this quiz.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const question = questions[current];
  const answer = question ? answers[question.id] ?? {} : {};
  const finished = attempt && attempt.status !== "IN_PROGRESS";

  function updateAnswer(patch) {
    setAnswers((previous) => ({
      ...previous,
      [question.id]: { ...(previous[question.id] ?? {}), ...patch },
    }));
  }

  async function saveCurrent() {
    if (!question || finished) return;
    const value = answers[question.id] ?? {};
    if (!value.choiceId && !value.textAnswer?.trim() && !value.file) return;
    setSaving(true);
    setError("");
    try {
      await quizzesApi.saveAnswer(id, {
        questionId: question.id,
        choiceId: value.choiceId || undefined,
        textAnswer: value.textAnswer?.trim() || undefined,
        file: value.file,
      });
    } catch (err) {
      setError(err.message || "Could not save this answer.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function move(direction) {
    try {
      await saveCurrent();
      setCurrent((index) => Math.min(Math.max(index + direction, 0), questions.length - 1));
    } catch {}
  }

  async function submitQuiz() {
    setSubmitting(true);
    setError("");
    try {
      await saveCurrent();
      const result = await quizzesApi.submitAttempt(id);
      setAttempt(result.attempt);
    } catch (err) {
      setError(err.message || "Could not submit the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="glass rounded-3xl h-96 animate-pulse shadow-glass" />;
  }

  if (error && !quiz) {
    return (
      <div className="glass rounded-3xl p-10 text-center shadow-glass">
        <span className="material-symbols-outlined text-5xl text-danger mb-3">error</span>
        <p className="font-bold mb-5">{error}</p>
        <Link href="/quizzes" className="text-secondary font-bold">Back to quizzes</Link>
      </div>
    );
  }

  if (finished) {
    const graded = attempt.status === "GRADED";
    return (
      <div className="max-w-2xl mx-auto glass rounded-3xl p-10 text-center shadow-elevated animate-fade-in-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary-light text-primary flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl">task_alt</span>
        </div>
        <h1 className="font-headline text-3xl font-extrabold mb-2">Quiz submitted</h1>
        <p className="text-ink-muted mb-8">
          {graded ? "Your result is ready." : "Answers requiring review were sent to your instructor."}
        </p>
        {graded && (
          <div className="bg-surface-low rounded-2xl p-6 mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Score</p>
            <p className="font-headline text-5xl font-extrabold text-primary">
              {attempt.score ?? 0}<span className="text-xl text-ink-muted">/{attempt.maxScore ?? 0}</span>
            </p>
          </div>
        )}
        <Link href="/quizzes" className="inline-flex px-6 py-3 rounded-xl bg-secondary text-white font-bold">
          Return to quizzes
        </Link>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="glass rounded-3xl p-10 text-center shadow-glass">
        <p className="font-bold">This quiz has no questions yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/quizzes" className="text-sm font-bold text-secondary">← Quizzes</Link>
          <h1 className="font-headline text-3xl font-extrabold mt-3">{quiz.title}</h1>
          <p className="text-ink-muted mt-1">Question {current + 1} of {questions.length}</p>
        </div>
        <span className="px-4 py-2 bg-surface-low rounded-full text-sm font-bold">{question.points} pts</span>
      </div>

      <div className="h-2 bg-surface-high rounded-full overflow-hidden mb-8">
        <div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      {error && <div className="mb-5 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      <section className="glass rounded-3xl p-8 shadow-elevated">
        {question.mediaUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.mediaUrl} alt="" className="max-h-72 rounded-2xl mb-6 mx-auto" />
          </>
        )}
        <h2 className="font-headline text-2xl font-bold leading-relaxed mb-8">{question.text}</h2>

        {(question.type === "MULTIPLE_CHOICE" || question.type === "MIXED") && (
          <div className="grid gap-3">
            {question.choices.map((choice) => (
              <label key={choice.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all ${
                answer.choiceId === choice.id ? "border-primary bg-primary-light" : "border-surface-high hover:bg-surface-low"
              }`}>
                <input
                  type="radio"
                  name={question.id}
                  checked={answer.choiceId === choice.id}
                  onChange={() => updateAnswer({ choiceId: choice.id })}
                  className="accent-primary"
                />
                <span className="font-semibold">{choice.text}</span>
              </label>
            ))}
          </div>
        )}

        {(question.type === "TEXT_ANSWER" || question.type === "MIXED") && (
          <textarea
            value={answer.textAnswer ?? ""}
            onChange={(event) => updateAnswer({ textAnswer: event.target.value })}
            rows={6}
            placeholder="Write your answer and reasoning…"
            className="w-full p-4 bg-surface-low rounded-2xl outline-none focus:ring-2 focus:ring-primary-light resize-y"
          />
        )}

        {(question.type === "MEDIA_UPLOAD" || question.type === "MIXED") && (
          <label className="mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed border-surface-high rounded-2xl cursor-pointer hover:bg-surface-low">
            <span className="material-symbols-outlined text-4xl text-primary mb-2">upload_file</span>
            <span className="font-bold">{answer.file?.name || (answer.mediaUrl ? "Uploaded answer" : "Upload image or PDF")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => updateAnswer({ file: event.target.files?.[0] })}
              className="hidden"
            />
          </label>
        )}
      </section>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => void move(-1)}
          disabled={current === 0 || saving}
          className="px-6 py-3 rounded-xl bg-surface-low font-bold disabled:opacity-40"
        >
          Previous
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => void move(1)}
            disabled={saving}
            className="px-7 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & next"}
          </button>
        ) : (
          <button
            onClick={() => void submitQuiz()}
            disabled={saving || submitting}
            className="px-7 py-3 rounded-xl bg-secondary text-white font-bold disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
