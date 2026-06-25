"use client";
import { useState, useEffect } from "react";
import { auth as authApi, getUser, setUser } from "@/lib/api";

export default function SettingsPage() {
  const stored = getUser();
  const [profile, setProfile] = useState({ name: stored?.name ?? "", email: stored?.email ?? "" });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [profileStatus, setProfileStatus] = useState("");
  const [pwdStatus, setPwdStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true); setProfileStatus("");
    try {
      const data = await authApi.updateMe({ name: profile.name });
      setUser({ ...stored, ...data.user });
      setProfileStatus("✓ Profile saved!");
    } catch (err) {
      setProfileStatus("✗ " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setProfileStatus(""), 3000);
    }
  }

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Settings</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Manage your profile and password.</p>
      </div>

      <div className="max-w-[640px] flex flex-col gap-6">
        {/* Profile */}
        <form onSubmit={handleSaveProfile} className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person</span> Profile
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Full Name</label>
              <input type="text" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Email (read-only)</label>
              <input type="email" value={profile.email} disabled
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none opacity-60 cursor-not-allowed" />
            </div>
            {stored?.studentCode && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Student Code</label>
                <div className="px-4 py-3 bg-surface-low rounded-xl text-sm font-mono text-ink-muted">{stored.studentCode}</div>
              </div>
            )}
            <button type="submit" disabled={saving}
              className="self-start px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all text-sm disabled:opacity-60 flex items-center gap-2">
              {saving && <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "Saving…" : profileStatus || "Save Profile"}
            </button>
          </div>
        </form>

        {/* Password notice */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span> Change Password
          </h2>
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            To change your password, use the <strong>Forgot Password</strong> flow from the login page. This sends a secure reset link to your email.
          </p>
          <a href="/forgot-password" className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-highest text-primary font-headline font-bold rounded-xl hover:bg-primary hover:text-white active:scale-95 transition-all text-sm">
            <span className="material-symbols-outlined text-lg">email</span>
            Send Reset Link
          </a>
        </div>

        {/* Account info */}
        <div className="glass rounded-2xl p-6 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-base mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span> Account Info
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Role</span>
              <span className="font-semibold capitalize">{stored?.role?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Member Since</span>
              <span className="font-semibold">{stored?.createdAt ? new Date(stored.createdAt).toLocaleDateString() : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
