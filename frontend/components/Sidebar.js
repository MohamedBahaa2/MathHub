"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard", filledIcon: true },
  { href: "/recorded-sessions", label: "Recorded Sessions", icon: "video_library" },
  { href: "/live-sessions", label: "Live Sessions", icon: "live_tv" },
  { href: "/assignments", label: "Assignments", icon: "assignment" },
  { href: "/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-0 top-0 w-[260px] h-screen bg-surface-low flex flex-col py-6 px-4 z-40 overflow-y-auto transition-transform duration-300 max-md:-translate-x-full max-md:data-[open=true]:translate-x-0"
        id="sidebar">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-ink-on-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>function</span>
          </div>
          <div>
            <h2 className="font-headline text-lg font-extrabold text-ink leading-tight">MathHub</h2>
            <span className="text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">Digital Atheneum</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-headline transition-all duration-300
                  ${isActive
                    ? "text-primary bg-primary-light font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-white/50 hover:translate-x-1"
                  }`}
              >
                {isActive && (
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <span
                  className="material-symbols-outlined text-xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 flex flex-col gap-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-headline text-ink-muted hover:text-ink hover:translate-x-1 transition-all duration-300">
            <span className="material-symbols-outlined text-xl">help</span>
            <span>Support</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-headline text-ink-muted hover:text-ink hover:translate-x-1 transition-all duration-300">
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-black/30 z-35 hidden" id="sidebar-overlay" />
    </>
  );
}
