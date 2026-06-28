"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth as authApi, clearToken } from "@/lib/api";

const studentNav = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/courses", label: "Explore Courses", icon: "explore" },
  { href: "/sessions", label: "Sessions", icon: "play_circle" },
  { href: "/assignments", label: "Assignments", icon: "assignment" },
  { href: "/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/help", label: "Help & Requests", icon: "support_agent" },
  { href: "/payments", label: "Payments", icon: "payments" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/courses", label: "Courses", icon: "school" },
  { href: "/admin/users", label: "Students & Parents", icon: "group" },
  { href: "/admin/sessions", label: "Sessions", icon: "play_circle" },
  { href: "/admin/assignments", label: "Assignments", icon: "assignment" },
  { href: "/admin/quizzes", label: "Quizzes & Exams", icon: "quiz" },
  { href: "/admin/help", label: "Help Requests", icon: "support_agent" },
  { href: "/admin/reports", label: "Reports", icon: "assessment" },
  { href: "/admin/payments", label: "Payments & Plans", icon: "payments" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const parentNav = [
  { href: "/parent", label: "Overview", icon: "dashboard" },
  { href: "/parent/reports", label: "Reports", icon: "assessment" },
  { href: "/parent/payments", label: "Payments", icon: "payments" },
  { href: "/parent/settings", label: "Settings", icon: "settings" },
];

const NAV_MAP = { student: studentNav, admin: adminNav, parent: parentNav };

const BRAND_LABELS = { student: "Student Portal", admin: "Admin Portal", parent: "Parent Portal" };

const warmedRoutes = new Set();

function warmRoute(href, router) {
  if (typeof window === "undefined" || warmedRoutes.has(href)) return;
  warmedRoutes.add(href);

  router.prefetch?.(href);
  fetch(href, {
    credentials: "same-origin",
    priority: "low",
  }).catch(() => {
    warmedRoutes.delete(href);
  });
}

export default function Sidebar({ role = "student" }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = NAV_MAP[role] ?? studentNav;
  const [pendingHref, setPendingHref] = useState(null);

  useEffect(() => {
    const routesToWarm = nav
      .map(item => item.href)
      .filter(href => href !== pathname);

    let cancelled = false;
    let index = 0;
    let idleId;
    let timeoutId;

    const warmNext = () => {
      if (cancelled || index >= routesToWarm.length) return;

      warmRoute(routesToWarm[index], router);
      index += 1;
      timeoutId = window.setTimeout(scheduleNext, 350);
    };

    const scheduleNext = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(warmNext, { timeout: 1500 });
      } else {
        timeoutId = window.setTimeout(warmNext, 600);
      }
    };

    timeoutId = window.setTimeout(scheduleNext, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (idleId) window.cancelIdleCallback?.(idleId);
    };
  }, [nav, pathname, router]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {}
    clearToken();
    router.push("/login");
  }

  return (
    <>
      <aside
        id="sidebar"
        className="fixed left-0 top-0 w-[260px] h-screen bg-surface-low flex flex-col py-6 px-4 z-40 overflow-y-auto transition-transform duration-300 max-md:-translate-x-full"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-ink-on-primary shadow-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>function</span>
          </div>
          <div>
            <h2 className="font-headline text-lg font-extrabold text-ink leading-tight">MathHub</h2>
            <span className="text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">{BRAND_LABELS[role]}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/admin" && item.href !== "/parent" && pathname.startsWith(item.href));
            const isPending = pendingHref === item.href && !isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => warmRoute(item.href, router)}
                onFocus={() => warmRoute(item.href, router)}
                onClick={() => {
                  if (!isActive) {
                    setPendingHref(item.href);
                    warmRoute(item.href, router);
                    window.setTimeout(() => {
                      setPendingHref(current => current === item.href ? null : current);
                    }, 3500);
                  }
                }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-headline transition-all duration-300 ${
                  isActive || isPending
                    ? "text-primary bg-primary-light font-bold shadow-glass translate-x-1"
                    : "text-ink-muted hover:text-ink hover:bg-white/50 hover:translate-x-1"
                }`}
              >
                {(isActive || isPending) && (
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full transition-all" />
                )}
                <span
                  className="material-symbols-outlined text-xl"
                  style={isActive || isPending ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold font-headline text-ink-muted hover:text-danger hover:bg-danger-light hover:translate-x-1 transition-all duration-300 w-full"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <div className="fixed inset-0 bg-black/30 z-35 hidden" id="sidebar-overlay" />
    </>
  );
}
