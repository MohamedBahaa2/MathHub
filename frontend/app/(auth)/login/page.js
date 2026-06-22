"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="glass rounded-3xl p-10 shadow-elevated animate-fade-in-up">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-ink-on-primary mb-4 shadow-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>function</span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold">Welcome to MathHub</h1>
          <p className="text-ink-muted text-sm mt-1">Digital Atheneum — Sign in to continue</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Email Address</label>
            <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Password</label>
            <div className="relative">
              <input type={show ? "text" : "password"} placeholder="••••••••" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all pr-12" />
              <button onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                <span className="material-symbols-outlined text-lg">{show ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-secondary font-semibold hover:opacity-70 transition-opacity">Forgot Password?</Link>
          </div>
          <button className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all mt-2">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
