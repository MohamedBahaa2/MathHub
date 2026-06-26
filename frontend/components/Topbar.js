"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { notifications as notifApi } from "@/lib/api";

const subscribeToUserStorage = () => () => {};
const getUserSnapshot = () => (
  typeof window === "undefined" ? null : localStorage.getItem("user")
);
const getServerUserSnapshot = () => null;

export default function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const userJson = useSyncExternalStore(
    subscribeToUserStorage,
    getUserSnapshot,
    getServerUserSnapshot
  );
  const user = useMemo(() => {
    try {
      return JSON.parse(userJson || "null");
    } catch {
      return null;
    }
  }, [userJson]);

  useEffect(() => {
    notifApi.list().then(d => setNotifList(d?.notifications || [])).catch(() => {});
  }, []);

  const unreadCount = notifList.filter(n => !n.read).length;

  function markAllRead() {
    notifApi.markAllRead().catch(() => {});
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
  }

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const NOTIF_ICONS = {
    SESSION_LIVE: "live_tv",
    RECORDING_READY: "play_circle",
    ASSIGNMENT_GRADED: "grade",
    NEW_ASSIGNMENT: "assignment",
    HELP_RESPONSE: "support_agent",
    QUIZ_GRADED: "quiz",
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface-low/85 backdrop-blur-xl flex items-center justify-between px-8 z-30 shadow-glass max-md:left-0">
      {/* Mobile menu button */}
      <button
        className="hidden max-md:flex w-10 h-10 items-center justify-center rounded-full text-ink-muted hover:bg-primary-xlight hover:text-primary transition-colors"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Search */}
      <div className="relative w-80 max-md:w-auto max-md:flex-1 max-md:mx-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-lg">
          search
        </span>
        <input
          type="text"
          placeholder="Search topics, lessons..."
          className="w-full py-2 pl-10 pr-4 bg-surface-low rounded-full text-sm text-ink placeholder:text-ink-muted focus:bg-surface-lowest focus:ring-2 focus:ring-primary-light outline-none transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:bg-primary-xlight hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-ink-on-primary text-[0.55rem] font-extrabold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-[340px] glass rounded-2xl shadow-elevated border border-surface-high overflow-hidden z-50 animate-fade-in-up">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-high">
                <h4 className="font-headline font-bold text-sm">Notifications</h4>
                <button
                  onClick={markAllRead}
                  className="text-xs text-secondary font-semibold hover:opacity-70 transition-opacity"
                >
                  Mark all read
                </button>
              </div>

              {/* List */}
              <div className="max-h-[340px] overflow-y-auto">
                {notifList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-ink-muted text-sm">No notifications</div>
                ) : notifList.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-surface-high/60 hover:bg-white/40 transition-colors ${
                      !n.read ? "bg-primary-xlight border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {NOTIF_ICONS[n.type] || "notifications"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] font-medium leading-snug">{n.message}</p>
                      <span className="text-xs text-ink-muted mt-0.5 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 text-center">
                <button onClick={() => setNotifOpen(false)} className="text-xs font-bold text-secondary hover:opacity-70 transition-opacity">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User name */}
        {user?.name && (
          <span className="text-sm font-semibold text-ink-muted hidden md:block max-w-[120px] truncate">
            {user.name.split(" ")[0]}
          </span>
        )}

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-ink-on-primary text-sm font-bold ring-2 ring-primary-light">
          {initials}
        </div>
      </div>
    </header>
  );
}
