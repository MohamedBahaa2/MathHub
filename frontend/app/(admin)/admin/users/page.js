"use client";
import { useState, useEffect, useCallback } from "react";
import { users as usersApi, courses as coursesApi } from "@/lib/api";

function EnrollmentsPanel({ user, onClose }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.getEnrollments(user.id);
      setEnrollments(data.enrollments || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function revoke(enrollmentId) {
    if (!window.confirm("Revoke this enrollment?")) return;
    setRevoking(enrollmentId);
    try {
      await usersApi.revokeEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    } catch (e) { setError(e.message); }
    finally { setRevoking(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-headline text-xl font-extrabold">Enrollments</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-xs text-ink-muted mb-6">{user.name} · {user.studentCode || user.email}</p>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        {loading ? (
          <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl route-shimmer" />)}</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-10 text-ink-muted">
            <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">school</span>
            <p className="text-sm font-semibold">No enrollments</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {enrollments.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3 bg-surface-low rounded-xl">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{e.course?.name || e.session?.title || "Enrollment"}</p>
                  <p className="text-xs text-ink-muted">
                    {e.course ? "Course" : "Session"}
                    {e.payment && ` · $${e.payment.amount?.toFixed(2)}`}
                    {e.payment?.status === "PAID" ? " ✓" : e.payment?.status ? ` (${e.payment.status})` : " · Free"}
                  </p>
                </div>
                <button onClick={() => revoke(e.id)} disabled={revoking === e.id}
                  className="px-3 py-1.5 bg-danger-light text-danger text-xs font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shrink-0 flex items-center gap-1">
                  {revoking === e.id
                    ? <span className="w-3 h-3 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-sm">person_remove</span>}
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ROLE_COLORS = {
  STUDENT: "bg-secondary-light text-secondary",
  PARENT: "bg-primary-light text-primary",
  SUPERADMIN: "bg-ink text-ink-on-primary",
  ASSISTANT: "bg-surface-high text-ink-muted",
};

function genCode(role) {
  const prefix = role === "PARENT" ? "PAR" : "STU";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT", studentCode: genCode("STUDENT") });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleRoleChange(role) {
    const needsCode = role === "STUDENT" || role === "PARENT";
    setForm(p => ({ ...p, role, studentCode: needsCode ? genCode(role) : "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.studentCode && (form.role === "STUDENT" || form.role === "PARENT")) {
        payload.studentCode = form.studentCode;
      }
      await usersApi.create(payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-extrabold">Add New User</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Full Name</label>
            <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Password</label>
            <div className="relative">
              <input required type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full px-4 py-3 pr-12 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                <span className="material-symbols-outlined text-lg">{showPwd ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Role</label>
            <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="ASSISTANT">Assistant (Admin)</option>
            </select>
          </div>
          {(form.role === "STUDENT" || form.role === "PARENT") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  {form.role === "PARENT" ? "Parent Code" : "Student Code"}
                </label>
                <button type="button" onClick={() => setForm(p => ({ ...p, studentCode: genCode(form.role) }))}
                  className="text-xs text-secondary font-semibold hover:opacity-70 transition-opacity">
                  ↺ Regenerate
                </button>
              </div>
              <input type="text" value={form.studentCode} onChange={e => setForm(p => ({ ...p, studentCode: e.target.value }))}
                placeholder={form.role === "PARENT" ? "PAR-XXXXXX" : "STU-XXXXXX"}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary-light" />
            </div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? "Creating…" : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [usersData, setUsersData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [enrollmentTarget, setEnrollmentTarget] = useState(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (tab === "Students") params.set("role", "STUDENT");
    else if (tab === "Parents") params.set("role", "PARENT");
    else if (tab === "Admins") params.set("role", "SUPERADMIN");
    if (search) params.set("search", search);
    params.set("limit", "50");
    return "?" + params.toString();
  }, [tab, search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [tabData, allData] = await Promise.all([
        usersApi.list(buildQuery()),
        tab !== "All" ? Promise.resolve(null) : null,
      ]);
      setUsersData(tabData.users || []);
      setTotal(tabData.pagination?.total ?? 0);
      // Get all users for counts (only if on All tab or first load)
      if (tab === "All" && !search) setAllUsers(tabData.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, tab, search]);

  // Load all users once for counts
  const loadAllForCounts = useCallback(async () => {
    try {
      const data = await usersApi.list("?limit=500");
      setAllUsers(data.users || []);
    } catch {}
  }, []);

  useEffect(() => { loadAllForCounts(); }, [loadAllForCounts]);
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const counts = {
    students: allUsers.filter(u => u.role === "STUDENT").length,
    parents: allUsers.filter(u => u.role === "PARENT").length,
    admins: allUsers.filter(u => u.role === "SUPERADMIN" || u.role === "ASSISTANT").length,
  };

  async function toggleActive(user) {
    setToggling(user.id);
    try {
      await usersApi.update(user.id, { isActive: !user.isActive });
      setUsersData(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(null);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">User Management</h1>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <p className="text-ink-muted text-sm">Total: <span className="font-bold text-ink">{total}</span></p>
            <span className="text-ink-muted">·</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-secondary">Students {counts.students}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">Parents {counts.parents}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-high text-ink-muted">Admins {counts.admins}</span>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Add User
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {["All", "Students", "Parents", "Admins"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-lg">search</span>
          <input type="text" placeholder="Search users..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-4 bg-surface-low rounded-full text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
        </div>
      </div>

      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["User", "Email", "Role", "Status", "Student Code", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1, 2, 3, 4, 5, 6, 7].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-24" /></td>)}
                  </tr>
                ))
              ) : usersData.map(u => (
                <tr key={u.id} className="hover:bg-white/30 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-light text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                        {u.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span className="font-headline font-bold text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role] ?? "bg-surface-high text-ink-muted"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.isActive ? "bg-primary-light text-primary" : "bg-danger-light text-danger"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-ink-muted">{u.studentCode ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {(u.role === "STUDENT" || u.role === "PARENT") && (
                        <button onClick={() => setEnrollmentTarget(u)}
                          title="Manage enrollments"
                          className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-secondary hover:bg-secondary-light transition-colors">
                          <span className="material-symbols-outlined text-lg">school</span>
                        </button>
                      )}
                      <button onClick={() => toggleActive(u)} disabled={toggling === u.id}
                        title={u.isActive ? "Deactivate" : "Activate"}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${u.isActive ? "text-ink-muted hover:text-danger hover:bg-danger-light" : "text-ink-muted hover:text-primary hover:bg-primary-light"} disabled:opacity-40`}>
                        {toggling === u.id
                          ? <span className="w-4 h-4 border border-primary/30 border-t-primary rounded-full animate-spin" />
                          : <span className="material-symbols-outlined text-lg">{u.isActive ? "person_off" : "person"}</span>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && usersData.length === 0 && (
            <div className="p-10 text-center text-ink-muted">No users found.</div>
          )}
        </div>
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} onCreated={() => { loadUsers(); loadAllForCounts(); }} />}
      {enrollmentTarget && <EnrollmentsPanel user={enrollmentTarget} onClose={() => setEnrollmentTarget(null)} />}
    </>
  );
}
