"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: "Ahmed Hassan", email: "ahmed@example.com" });
  const [notifs, setNotifs] = useState({ session_live: true, recording_ready: true, assignment_graded: true, subscription: false });
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Settings</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Manage your profile, password, and notification preferences.</p>
      </div>

      <div className="max-w-[640px] flex flex-col gap-6">
        {/* Profile */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">person</span> Profile</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Full Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
            </div>
            <button onClick={handleSave} className="self-start px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all text-sm">
              {saved ? "✓ Saved!" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">lock</span> Change Password</h2>
          <div className="flex flex-col gap-4">
            {["Current Password", "New Password", "Confirm New Password"].map((label) => (
              <div key={label}>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">{label}</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
              </div>
            ))}
            <button className="self-start px-6 py-2.5 bg-surface-highest text-primary font-headline font-bold rounded-xl hover:bg-primary hover:text-white active:scale-95 transition-all text-sm">Update Password</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">notifications</span> Notifications</h2>
          <div className="flex flex-col gap-4">
            {[
              { key: "session_live", label: "Session goes live", desc: "Alert when a session starts" },
              { key: "recording_ready", label: "Recording available", desc: "When a recording is uploaded" },
              { key: "assignment_graded", label: "Assignment graded", desc: "When teacher grades your work" },
              { key: "subscription", label: "Subscription reminders", desc: "Renewal and billing alerts" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-4 py-2">
                <div>
                  <p className="font-semibold text-sm">{n.label}</p>
                  <p className="text-xs text-ink-muted">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifs(prev => ({...prev, [n.key]: !prev[n.key]}))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notifs[n.key] ? "bg-primary" : "bg-surface-high"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${notifs[n.key] ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
