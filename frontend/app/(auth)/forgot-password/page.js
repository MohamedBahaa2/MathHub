"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="glass rounded-3xl p-10 shadow-elevated animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-secondary-light text-secondary rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold">Reset Password</h1>
          <p className="text-ink-muted text-sm mt-1 text-center">Enter your email and we'll send a reset link</p>
        </div>
        {!sent ? (
          <div className="flex flex-col gap-4">
            <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light transition-all" />
            <button onClick={() => setSent(true)} className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all">
              Send Reset Link
            </button>
          </div>
        ) : (
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            <p className="font-headline font-bold">Check your email</p>
            <p className="text-ink-muted text-sm mt-1">A reset link has been sent if that account exists.</p>
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-secondary font-semibold hover:opacity-70 transition-opacity">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
