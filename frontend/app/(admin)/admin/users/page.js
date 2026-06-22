"use client";
import { useState } from "react";

const USERS = [
  { id: 0, name: "Ahmed Bahaa", email: "admin@mathhub.com", role: "Admin", status: "Active", joined: "Jan 2025", avatar: "A" },
  { id: 1, name: "Sara Mohamed", email: "sara@example.com", role: "Student", status: "Active", joined: "Jan 2025", avatar: "S" },
  { id: 2, name: "Karim Ahmed", email: "karim@example.com", role: "Student", status: "Active", joined: "Feb 2025", avatar: "K" },
  { id: 3, name: "Omar Sayed", email: "omar@example.com", role: "Student", status: "Inactive", joined: "Mar 2025", avatar: "O" },
  { id: 4, name: "Hana Sayed (Parent)", email: "hana@example.com", role: "Parent", status: "Active", joined: "Mar 2025", avatar: "H" },
  { id: 5, name: "Youssef Ali", email: "youssef@example.com", role: "Student", status: "Active", joined: "Apr 2025", avatar: "Y" },
];

const ROLE_COLORS = {
  Student: "bg-secondary-light text-secondary",
  Parent: "bg-primary-light text-primary",
  Admin: "bg-ink text-ink-on-primary",
};
const STATUS_COLORS = { Active: "bg-primary-light text-primary", Inactive: "bg-danger-light text-danger" };
const TABS = ["All", "Students", "Parents", "Admins"];

export default function AdminUsersPage() {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = USERS.filter(u => {
    const matchesTab =
      tab === "All" ||
      (tab === "Admins" && u.role === "Admin") ||
      (tab !== "Admins" && u.role === tab.slice(0, -1));
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <div className="flex items-start justify-between mb-10 animate-fade-in-up">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">User Management</h1>
          <p className="text-ink-muted text-base leading-relaxed">Manage all user accounts — students, parents, and admin staff.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all shrink-0">
          + Add User
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>{t}</button>
          ))}
        </div>
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-lg">search</span>
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2 pl-10 pr-4 bg-surface-low rounded-full text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-low">
              {["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-light text-secondary flex items-center justify-center font-bold text-sm shrink-0">{u.avatar}</div>
                      <span className="font-headline font-bold text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{u.email}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[u.status]}`}>{u.status}</span></td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{u.joined}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-danger hover:bg-danger-light transition-colors"><span className="material-symbols-outlined text-lg">person_off</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl shadow-elevated w-full max-w-[520px] p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-extrabold">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">First Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Role</label>
                <select className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light">
                  <option>Student</option>
                  <option>Parent</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning-light rounded-xl text-[0.8125rem] text-[#8B6914] font-medium">
                <span className="material-symbols-outlined text-lg shrink-0">warning</span>
                <span>Admin users have <strong>full platform access</strong> including user management and payments. Only grant this to trusted staff.</span>
              </div>
              <button onClick={() => setShowModal(false)} className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
