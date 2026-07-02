"use client";
import { useState, useEffect } from "react";
import { courses as coursesApi } from "@/lib/api";

function CourseModal({ course, onClose, onSaved }) {
  const isEdit = !!course;
  const [form, setForm] = useState({
    name: course?.name ?? "",
    description: course?.description ?? "",
    coursePrice: course?.coursePrice ?? "",
    sessionPrice: course?.sessionPrice ?? "",
    isActive: course?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = {
      name: form.name,
      description: form.description || undefined,
      coursePrice: Number(form.coursePrice),
      sessionPrice: Number(form.sessionPrice),
      isActive: form.isActive,
    };
    try {
      if (isEdit) await coursesApi.update(course.id, payload);
      else await coursesApi.create(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[560px] p-8 animate-fade-in-up my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-extrabold">{isEdit ? "Edit Course" : "New Course"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Name</label>
            <input required type="text" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Calculus I — Full Course"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Course Price (USD)</label>
              <input required type="number" min="0" value={form.coursePrice}
                onChange={e => setForm(p => ({ ...p, coursePrice: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Session Price (USD)</label>
              <input required type="number" min="0" value={form.sessionPrice}
                onChange={e => setForm(p => ({ ...p, sessionPrice: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-5 h-5 accent-primary rounded" />
            <span className="text-sm font-semibold text-ink">Active (Visible to Students)</span>
          </label>
          <button type="submit" disabled={saving}
            className="w-full mt-4 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  async function loadCourses() {
    setLoading(true);
    try {
      const d = await coursesApi.list();
      setCoursesList(d.courses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCourses(); }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this course? This will remove the course link from sessions, but keep the sessions. This cannot be undone.")) return;
    try {
      await coursesApi.delete(id);
      setCoursesList(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Courses</h1>
          <p className="text-ink-muted text-base leading-relaxed">Manage overarching courses and their pricing.</p>
        </div>
        <button onClick={() => { setEditCourse(null); setShowModal(true); }}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Add Course
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["Name", "Description", "Sessions", "Enrollments", "Course Price", "Session Price", "Status", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1,2,3,4,5,6,7,8].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-16" /></td>)}
                  </tr>
                ))
              ) : coursesList.map(c => (
                <tr key={c.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 font-headline font-bold text-sm max-w-[200px]">
                    <p className="truncate">{c.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted max-w-[200px]">
                    <p className="truncate">{c.description || "—"}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{c._count?.sessions ?? 0}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{c._count?.enrollments ?? 0}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">${c.coursePrice}</td>
                  <td className="px-6 py-4 text-sm font-bold text-secondary">${c.sessionPrice}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.isActive ? "bg-primary-light text-primary" : "bg-surface-high text-ink-muted"}`}>
                      {c.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditCourse(c); setShowModal(true); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-danger hover:bg-danger-light transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && coursesList.length === 0 && (
            <div className="p-10 text-center text-ink-muted">No courses found.</div>
          )}
        </div>
      </div>

      {showModal && (
        <CourseModal
          course={editCourse}
          onClose={() => setShowModal(false)}
          onSaved={loadCourses}
        />
      )}
    </>
  );
}
