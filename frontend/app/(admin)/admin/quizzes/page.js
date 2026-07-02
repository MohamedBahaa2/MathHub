"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { quizzes as quizzesApi, sessions as sessionsApi } from "@/lib/api";

const EMPTY_QUESTION = {
  text: "",
  allowsMCQ: true,
  allowsText: false,
  allowsMedia: false,
  points: 1,
  choices: ["", "", "", ""],
  correctChoice: 0,
  correctText: "",
};

function Pill({ children, tone = "neutral" }) {
  const tones = {
    success: "bg-primary-light text-primary",
    warning: "bg-warning-light text-[#8B6914]",
    info: "bg-secondary-light text-secondary",
    neutral: "bg-surface-high text-ink-muted",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function QuestionBuilder({ quiz, onSaved }) {
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setChoice(index, value) {
    setForm((current) => ({
      ...current,
      choices: current.choices.map((choice, choiceIndex) => choiceIndex === index ? value : choice),
    }));
  }

  function toggleMode(key) {
    setForm(f => ({ ...f, [key]: !f[key] }));
  }

  // Derive legacy type for backend compatibility
  function deriveType() {
    const { allowsMCQ, allowsText, allowsMedia } = form;
    const count = [allowsMCQ, allowsText, allowsMedia].filter(Boolean).length;
    if (count > 1) return "MIXED";
    if (allowsMCQ) return "MULTIPLE_CHOICE";
    if (allowsText) return "TEXT_ANSWER";
    if (allowsMedia) return "MEDIA_UPLOAD";
    return "MULTIPLE_CHOICE";
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.allowsMCQ && !form.allowsText && !form.allowsMedia) {
      setError("Select at least one answer mode.");
      return;
    }
    if (form.allowsMCQ && form.choices.some((choice) => !choice.trim())) {
      setError("Complete all choices for the MCQ option.");
      return;
    }
    setSaving(true);
    try {
      const created = await quizzesApi.addQuestion(quiz.id, {
        text: form.text.trim(),
        type: deriveType(),
        allowsMCQ: form.allowsMCQ,
        allowsText: form.allowsText,
        allowsMedia: form.allowsMedia,
        points: Number(form.points),
        order: (quiz.questions?.length || 0) + 1,
        correctText: form.allowsText && form.correctText ? form.correctText : undefined,
      });
      if (form.allowsMCQ) {
        await Promise.all(form.choices.map((choice, index) =>
          quizzesApi.addChoice(quiz.id, created.question.id, {
            text: choice.trim(),
            order: index + 1,
            isCorrect: index === Number(form.correctChoice),
          })
        ));
      }
      setForm({ ...EMPTY_QUESTION, choices: [...EMPTY_QUESTION.choices] });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const modeActive = form.allowsMCQ || form.allowsText || form.allowsMedia;

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-6 shadow-glass">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-headline text-lg font-extrabold">Add question</h3>
          <p className="text-xs text-ink-muted">Select all answer modes that apply to this question.</p>
        </div>
      </div>

      {/* Answer mode checkboxes */}
      <div className="flex gap-3 mb-5">
        {[
          { key: "allowsMCQ", label: "Multiple Choice", icon: "radio_button_checked", color: "text-primary bg-primary-light" },
          { key: "allowsText", label: "Written Answer", icon: "edit_note", color: "text-secondary bg-secondary-light" },
          { key: "allowsMedia", label: "Media Upload", icon: "upload_file", color: "text-[#8B6914] bg-warning-light" },
        ].map(({ key, label, icon, color }) => (
          <button key={key} type="button" onClick={() => toggleMode(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form[key] ? `${color} border-transparent` : "bg-surface-low text-ink-muted border-surface-high hover:border-primary/30"}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: form[key] ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-danger-light text-danger text-sm">{error}</div>}

      <textarea required rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
        placeholder="Write the question…"
        className="w-full p-4 rounded-xl bg-surface-low outline-none focus:ring-2 focus:ring-primary-light resize-y mb-4" />

      {form.allowsMCQ && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <p className="col-span-2 text-xs font-bold text-ink-muted uppercase tracking-wide">MCQ Choices</p>
          {form.choices.map((choice, index) => (
            <label key={index} className={`flex items-center gap-3 p-3 rounded-xl border ${Number(form.correctChoice) === index ? "border-primary bg-primary-light" : "border-surface-high"}`}>
              <input type="radio" name="correctChoice" checked={Number(form.correctChoice) === index}
                onChange={() => setForm({ ...form, correctChoice: index })} className="accent-primary" />
              <input value={choice} onChange={(e) => setChoice(index, e.target.value)}
                placeholder={`Choice ${index + 1}`} className="bg-transparent outline-none min-w-0 flex-1 text-sm" />
            </label>
          ))}
        </div>
      )}

      {form.allowsText && (
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Expected Answer (for auto-grading, optional)</label>
          <input type="text" value={form.correctText} onChange={e => setForm(f => ({ ...f, correctText: e.target.value }))}
            placeholder="Leave blank to mark for manual review"
            className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary-light" />
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Points
          <input required type="number" min={1} max={100} value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
            className="block mt-1 w-24 px-3 py-2 rounded-xl bg-surface-low text-ink outline-none" />
        </label>
        <button disabled={saving || !modeActive} className="px-6 py-3 rounded-xl bg-secondary text-white font-bold disabled:opacity-50">
          {saving ? "Adding…" : "Add question"}
        </button>
      </div>
    </form>
  );
}

function CreateQuizModal({ onClose, onCreated }) {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", sessionId: "", requiresManualGrading: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionsApi.list().then((data) => setSessions(data.sessions || [])).catch(() => {});
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await quizzesApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        sessionId: form.sessionId || undefined,
        requiresManualGrading: form.requiresManualGrading,
      });
      onCreated(result.quiz);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
      <form onSubmit={submit} className="glass w-full max-w-xl rounded-3xl p-8 shadow-elevated animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-headline text-2xl font-extrabold">Create exam</h2>
            <p className="text-sm text-ink-muted mt-1">Add MCQ, written, or both after creating it.</p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-danger-light text-danger text-sm">{error}</div>}
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Exam title
            <input required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-3 rounded-xl bg-surface-low text-sm text-ink normal-case outline-none focus:ring-2 focus:ring-primary-light"
              placeholder="e.g. Algebra midterm" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Instructions
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-3 rounded-xl bg-surface-low text-sm text-ink normal-case outline-none focus:ring-2 focus:ring-primary-light resize-none"
              placeholder="Optional instructions for students" />
          </label>
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
            Linked session
            <select value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              className="px-4 py-3 rounded-xl bg-surface-low text-sm text-ink normal-case outline-none">
              <option value="">Available to all students</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.title}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 p-3 bg-surface-low rounded-xl cursor-pointer">
              <input type="checkbox" checked={form.requiresManualGrading}
                onChange={e => setForm(f => ({ ...f, requiresManualGrading: e.target.checked }))}
                className="accent-secondary w-4 h-4" />
              <div>
                <p className="text-sm font-semibold normal-case">Requires Manual Grading</p>
                <p className="text-xs text-ink-muted normal-case">Written/media answers will wait for teacher review</p>
              </div>
            </label>
          <button disabled={saving} className="mt-2 py-3 rounded-xl bg-primary text-white font-bold shadow-primary disabled:opacity-50">
            {saving ? "Creating…" : "Create exam"}
          </button>
        </div>
      </form>
    </div>
  );
}


function GradePanel({ quiz, attempt, onClose, onGraded }) {
  const reviewAnswers = useMemo(
    () => (attempt.answers || []).filter((answer) => answer.pointsEarned == null),
    [attempt]
  );
  const [grades, setGrades] = useState(() => Object.fromEntries(
    reviewAnswers.map((answer) => [answer.id, answer.pointsEarned ?? 0])
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingMedia, setDeletingMedia] = useState(null);
  const [deletedMedia, setDeletedMedia] = useState(() => new Set());

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await quizzesApi.gradeAttempt(quiz.id, attempt.id, reviewAnswers.map((answer) => {
        const pointsEarned = Number(grades[answer.id] || 0);
        return { answerId: answer.id, pointsEarned, isCorrect: pointsEarned >= answer.question.points };
      }));
      await onGraded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeMedia(answer) {
    if (!window.confirm("Permanently delete this uploaded answer? The grade and written answer will remain.")) return;
    setDeletingMedia(answer.id);
    setError("");
    try {
      await quizzesApi.deleteAnswerMedia(quiz.id, attempt.id, answer.id);
      setDeletedMedia((current) => new Set([...current, answer.id]));
      await onGraded();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMedia(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <form onSubmit={submit} className="h-full w-full max-w-2xl bg-surface overflow-y-auto p-7 shadow-elevated animate-page-enter">
        <div className="flex justify-between items-start gap-4 mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Manual grading</p>
            <h2 className="font-headline text-2xl font-extrabold mt-1">{attempt.student?.name}</h2>
            <p className="text-sm text-ink-muted">{quiz.title}</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-surface-low">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-danger-light text-danger text-sm">{error}</div>}
        <div className="grid gap-4">
          {(attempt.answers || []).map((answer, index) => {
            const needsReview = answer.pointsEarned == null;
            return (
              <article key={answer.id} className="glass rounded-2xl p-5 shadow-glass">
                <div className="flex justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-ink-muted font-bold mb-1">Question {index + 1}</p>
                    <h3 className="font-semibold">{answer.question.text}</h3>
                  </div>
                  <Pill tone={needsReview ? "warning" : "success"}>
                    {needsReview ? "Review" : `${answer.pointsEarned}/${answer.question.points}`}
                  </Pill>
                </div>
                {answer.choice && <p className="p-3 bg-surface-low rounded-xl text-sm">Selected: <b>{answer.choice.text}</b></p>}
                {answer.textAnswer && <p className="p-4 bg-surface-low rounded-xl text-sm whitespace-pre-wrap">{answer.textAnswer}</p>}
                {!answer.choice && !answer.textAnswer && !answer.mediaUrl && (
                  <p className="p-3 bg-danger-light text-danger rounded-xl text-sm">No answer submitted</p>
                )}
                {answer.mediaUrl && !deletedMedia.has(answer.id) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <a href={answer.mediaUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary-light text-secondary font-bold text-sm">
                      <span className="material-symbols-outlined">open_in_new</span> View uploaded answer
                    </a>
                    {attempt.status === "GRADED" && (
                      <button type="button" onClick={() => void removeMedia(answer)} disabled={deletingMedia === answer.id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-danger-light text-danger font-bold text-sm disabled:opacity-50">
                        <span className="material-symbols-outlined text-lg">delete</span>
                        {deletingMedia === answer.id ? "Deletingâ€¦" : "Delete media"}
                      </button>
                    )}
                  </div>
                )}
                {deletedMedia.has(answer.id) && (
                  <p className="mt-3 px-3 py-2 rounded-xl bg-primary-light text-primary text-sm font-bold">Media deleted; grade retained.</p>
                )}
                {needsReview && (
                  <label className="flex items-center justify-end gap-3 mt-4 text-sm font-bold">
                    Score
                    <input type="number" min={0} max={answer.question.points} step="0.5"
                      value={grades[answer.id] ?? 0}
                      onChange={(e) => setGrades({ ...grades, [answer.id]: e.target.value })}
                      className="w-24 px-3 py-2 rounded-xl bg-surface-low outline-none focus:ring-2 focus:ring-primary-light" />
                    <span className="text-ink-muted">/ {answer.question.points}</span>
                  </label>
                )}
              </article>
            );
          })}
        </div>
        <div className="sticky bottom-0 mt-6 py-4 bg-surface/95 backdrop-blur flex justify-end">
          <button disabled={saving || reviewAnswers.length === 0}
            className="px-7 py-3 rounded-xl bg-primary text-white font-bold shadow-primary disabled:opacity-50">
            {saving ? "Saving grades…" : "Save final grade"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminQuizzesPage() {
  const [quizList, setQuizList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [grading, setGrading] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    const data = await quizzesApi.list();
    const list = data.quizzes || [];
    setQuizList(list);
    setSelectedId((current) => current || list[0]?.id || null);
    return list;
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setQuiz(null);
      setAttempts([]);
      return;
    }
    setDetailLoading(true);
    try {
      const [quizData, attemptData] = await Promise.all([quizzesApi.get(id), quizzesApi.getAttempts(id)]);
      setQuiz(quizData.quiz);
      setAttempts(attemptData.attempts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [loadList]);

  useEffect(() => { void loadDetail(selectedId); }, [selectedId, loadDetail]);

  async function refresh() {
    await Promise.all([loadList(), loadDetail(selectedId)]);
  }

  async function togglePublished() {
    try {
      await quizzesApi.update(quiz.id, { isPublished: !quiz.isPublished });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeQuiz() {
    if (!window.confirm(`Delete "${quiz.title}" and all its attempts?`)) return;
    try {
      await quizzesApi.delete(quiz.id);
      setSelectedId(null);
      const list = await loadList();
      setSelectedId(list[0]?.id || null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeQuestion(question) {
    if (!window.confirm("Remove this question?")) return;
    try {
      await quizzesApi.deleteQuestion(quiz.id, question.id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const examType = useMemo(() => {
    const types = new Set((quiz?.questions || []).map((question) => question.type));
    if (types.size > 1) return "Mixed exam";
    if (types.has("MULTIPLE_CHOICE")) return "Auto-graded MCQ";
    if (types.size === 1) return "Manually graded";
    return "No questions";
  }, [quiz]);
  const pending = attempts.filter((attempt) => attempt.status === "SUBMITTED").length;
  const totalPoints = (quiz?.questions || []).reduce((sum, question) => sum + question.points, 0);

  return (
    <>
      <header className="flex items-start justify-between gap-5 mb-8 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight">Quizzes & Exams</h1>
          <p className="text-ink-muted mt-2">Build auto-marked MCQs, written exams, or combine both.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-primary hover:brightness-110">
          + Create exam
        </button>
      </header>
      {error && <div className="mb-5 p-3 rounded-xl bg-danger-light text-danger text-sm">{error}</div>}

      <div className="grid lg:grid-cols-[310px_1fr] gap-6 items-start">
        <aside className="glass rounded-2xl shadow-glass overflow-hidden">
          <div className="p-4 border-b border-surface-high flex justify-between items-center">
            <p className="font-bold">All exams</p>
            <Pill>{quizList.length}</Pill>
          </div>
          <div className="p-2 grid gap-1 max-h-[70vh] overflow-y-auto">
            {loading ? [1, 2, 3].map((item) => <div key={item} className="h-20 m-1 rounded-xl route-shimmer" />) :
              quizList.length === 0 ? <p className="p-8 text-center text-sm text-ink-muted">No exams yet.</p> :
              quizList.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)}
                  className={`text-left p-4 rounded-xl transition-all ${selectedId === item.id ? "bg-primary-light text-primary" : "hover:bg-surface-low"}`}>
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                    <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${item.isPublished ? "bg-primary" : "bg-ink-muted/30"}`} />
                  </div>
                  <p className="text-xs opacity-70 mt-1">{item._count?.questions || 0} questions · {item._count?.attempts || 0} attempts</p>
                  {item.requiresManualGrading && (
                    <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-[#8B6914] bg-warning-light px-2 py-0.5 rounded-full mt-1.5">
                      <span className="material-symbols-outlined text-[0.7rem]">rate_review</span>
                      Manual Grading
                    </span>
                  )}
                </button>
              ))}
          </div>
        </aside>

        <main className="min-w-0">
          {detailLoading ? <div className="h-96 rounded-2xl route-shimmer" /> : !quiz ? (
            <div className="glass rounded-2xl p-14 text-center text-ink-muted">
              <span className="material-symbols-outlined text-5xl opacity-30">quiz</span>
              <p className="font-bold mt-3">Create an exam to begin.</p>
            </div>
          ) : (
            <div className="grid gap-6 animate-page-enter">
              <section className="glass rounded-2xl p-6 shadow-glass">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Pill tone={quiz.isPublished ? "success" : "neutral"}>{quiz.isPublished ? "Published" : "Draft"}</Pill>
                      <Pill tone="info">{examType}</Pill>
                      {quiz.requiresManualGrading && <Pill tone="warning">Manual Grading</Pill>}
                      {pending > 0 && <Pill tone="warning">{pending} awaiting review</Pill>}
                    </div>
                    <h2 className="font-headline text-2xl font-extrabold">{quiz.title}</h2>
                    <p className="text-sm text-ink-muted mt-1">{quiz.description || "No instructions added."}</p>
                    <p className="text-xs text-ink-muted mt-3">{quiz.questions.length} questions · {totalPoints} points</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={togglePublished} disabled={quiz.questions.length === 0 && !quiz.isPublished}
                      className="px-4 py-2 rounded-xl bg-secondary text-white text-sm font-bold disabled:opacity-40">
                      {quiz.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={removeQuiz} className="w-10 h-10 rounded-xl bg-danger-light text-danger" title="Delete exam">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </section>

              <QuestionBuilder quiz={quiz} onSaved={refresh} />

              <section className="glass rounded-2xl shadow-glass overflow-hidden">
                <div className="p-5 border-b border-surface-high"><h3 className="font-headline text-lg font-extrabold">Questions</h3></div>
                {quiz.questions.length === 0 ? <p className="p-10 text-center text-ink-muted text-sm">Add the first question above.</p> :
                  <div className="divide-y divide-surface-high">
                    {quiz.questions.map((question, index) => (
                      <article key={question.id} className="p-5 flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-surface-low grid place-items-center font-bold shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{question.text}</p>
                            <Pill tone={question.type === "MULTIPLE_CHOICE" ? "success" : "warning"}>
                              {question.type === "MULTIPLE_CHOICE" ? "Auto" : "Manual"}
                            </Pill>
                          </div>
                          {question.choices?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {question.choices.map((choice) => (
                                <span key={choice.id} className={`px-3 py-1 rounded-lg text-xs ${
                                  choice.isCorrect ? "bg-primary-light text-primary font-bold" : "bg-surface-low text-ink-muted"
                                }`}>{choice.text}{choice.isCorrect ? " ✓" : ""}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-ink-muted mt-2">{question.points} points</p>
                        </div>
                        <button onClick={() => removeQuestion(question)} className="text-ink-muted hover:text-danger">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </article>
                    ))}
                  </div>}
              </section>

              <section className="glass rounded-2xl shadow-glass overflow-hidden">
                <div className="p-5 border-b border-surface-high flex justify-between">
                  <h3 className="font-headline text-lg font-extrabold">Student attempts</h3>
                  <Pill tone={pending ? "warning" : "neutral"}>{pending} pending</Pill>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-low text-[0.6875rem] uppercase tracking-widest text-ink-muted">
                      <tr>{["Student", "Submitted", "Score", "Status", ""].map((label) =>
                        <th key={label} className="px-5 py-3">{label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {attempts.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-ink-muted text-sm">No attempts yet.</td></tr> :
                        attempts.map((attempt) => (
                          <tr key={attempt.id} className="border-t border-surface-high/60">
                            <td className="px-5 py-4"><p className="font-bold text-sm">{attempt.student.name}</p><p className="text-xs text-ink-muted">{attempt.student.email}</p></td>
                            <td className="px-5 py-4 text-sm text-ink-muted">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "In progress"}</td>
                            <td className="px-5 py-4 font-bold">{attempt.score != null ? `${attempt.score}/${attempt.maxScore}` : "—"}</td>
                            <td className="px-5 py-4"><Pill tone={attempt.status === "GRADED" ? "success" : attempt.status === "SUBMITTED" ? "warning" : "neutral"}>{attempt.status.replace("_", " ")}</Pill></td>
                            <td className="px-5 py-4 text-right">
                              {(attempt.status === "SUBMITTED" || (attempt.status === "GRADED" && attempt.answers?.some(answer => answer.mediaUrl))) && (
                                <button onClick={() => setGrading(attempt)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold ${attempt.status === "SUBMITTED" ? "bg-primary text-white" : "bg-secondary-light text-secondary"}`}>
                                  {attempt.status === "SUBMITTED" ? "Grade" : "Review media"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {showCreate && <CreateQuizModal onClose={() => setShowCreate(false)} onCreated={(created) => {
        void loadList();
        setSelectedId(created.id);
      }} />}
      {grading && <GradePanel quiz={quiz} attempt={grading} onClose={() => setGrading(null)} onGraded={refresh} />}
    </>
  );
}
