"use client";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [platform, setPlatform] = useState({ name: "MathHub", timezone: "Africa/Cairo", defaultPrice: "29" });
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Admin Settings</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Configure platform-wide settings, payment integration, and defaults.</p>
      </div>

      <div className="max-w-[640px] flex flex-col gap-6">

        {/* Platform */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span> Platform
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Platform Name</label>
              <input
                type="text"
                value={platform.name}
                onChange={e => setPlatform(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Timezone</label>
              <select
                value={platform.timezone}
                onChange={e => setPlatform(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all"
              >
                <option value="Africa/Cairo">Cairo (GMT+2)</option>
                <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                <option value="Asia/Dubai">Dubai (GMT+4)</option>
                <option value="Asia/Kuwait">Kuwait (GMT+3)</option>
                <option value="Africa/Casablanca">Casablanca (GMT+1)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Default Session Price (USD)</label>
              <input
                type="number"
                value={platform.defaultPrice}
                onChange={e => setPlatform(p => ({ ...p, defaultPrice: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all"
              />
            </div>
            <button
              onClick={handleSave}
              className="self-start px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              {saved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>
        </div>

        {/* PayTabs Integration */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span> PayTabs Integration
          </h2>
          <p className="text-xs text-ink-muted mb-6">API keys are stored securely in backend environment variables. Only public identifiers are shown here.</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Profile ID</label>
              <div className="w-full px-4 py-3 bg-surface-lowest rounded-xl text-sm text-ink-muted font-mono border border-surface-high select-all">
                PT-12345678
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Payment Page URL</label>
              <div className="w-full px-4 py-3 bg-surface-lowest rounded-xl text-sm text-ink-muted font-mono border border-surface-high select-all break-all">
                https://secure.paytabs.com/payment/request
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary-xlight rounded-xl text-[0.8125rem] text-secondary font-medium">
              <span className="material-symbols-outlined text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <span>To update API keys or webhook secrets, edit the <code className="bg-secondary-light px-1 rounded text-xs">.env</code> file on the server and restart the backend service.</span>
            </div>
          </div>
        </div>

        {/* Admin Password */}
        <div className="glass rounded-2xl p-8 shadow-glass animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span> Change Password
          </h2>
          <div className="flex flex-col gap-4">
            {["Current Password", "New Password", "Confirm New Password"].map((label) => (
              <div key={label}>
                <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">{label}</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
              </div>
            ))}
            <button className="self-start px-6 py-2.5 bg-surface-highest text-primary font-headline font-bold rounded-xl hover:bg-primary hover:text-white active:scale-95 transition-all text-sm">
              Update Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-8 border-2 border-danger-light animate-fade-in-up">
          <h2 className="font-headline font-bold text-lg mb-2 flex items-center gap-2 text-danger">
            <span className="material-symbols-outlined">dangerous</span> Danger Zone
          </h2>
          <p className="text-sm text-ink-muted mb-4">These actions are irreversible. Proceed with caution.</p>
          <button className="px-6 py-2.5 border border-danger text-danger text-sm font-bold rounded-xl hover:bg-danger hover:text-white active:scale-95 transition-all">
            Reset All Platform Data
          </button>
        </div>

      </div>
    </>
  );
}
