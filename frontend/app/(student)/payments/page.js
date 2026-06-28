"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { payments as paymentsApi } from "@/lib/api";

export default function PaymentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    paymentsApi.list()
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const list = data?.payments ?? [];
  const totalSpent = list.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const sessions = list.filter(p => p.type === "SESSION").length;
  const courses = list.filter(p => p.type === "COURSE").length;

  async function handleDownload(id) {
    setDownloading(id);
    try {
      const res = await paymentsApi.downloadReceipt(id);
      if (!res.ok) throw new Error("Receipt not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `receipt-${id}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Your payment history. Buy more sessions from the Sessions page.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "school", label: "Courses Bought", value: loading ? "—" : courses, color: "text-secondary", bg: "bg-secondary-light" },
          { icon: "play_circle", label: "Sessions Bought", value: loading ? "—" : sessions, color: "text-primary", bg: "bg-primary-light" },
          { icon: "payments", label: "Total Spent", value: loading ? "—" : `$${totalSpent.toFixed(2)}`, color: "text-[#8B6914]", bg: "bg-warning-light" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-6 shadow-glass flex items-center gap-4 animate-fade-in-up">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-headline text-2xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {/* Payment History */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">Payment History</h3>
          <Link href="/sessions" className="text-sm font-bold text-secondary hover:opacity-70 transition-opacity">+ Buy more →</Link>
        </div>
        {loading ? (
          <div className="p-8">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-surface-low rounded-xl mb-3" />)}</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-ink-muted">
            <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">receipt_long</span>
            <p className="font-semibold">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low">
                  {["Date", "Description", "Type", "Amount", "Status", "Receipt"].map(h => (
                    <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                    <td className="px-6 py-4 text-sm">{new Date(p.createdAt ?? p.paidAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.description ?? p.session?.title ?? p.course?.name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.type === "COURSE" ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                        {p.type ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-headline font-bold text-primary">${(p.amount ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">{p.status ?? "Paid"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownload(p.id)}
                        disabled={downloading === p.id}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors disabled:opacity-40">
                        {downloading === p.id
                          ? <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                          : <span className="material-symbols-outlined text-lg">download</span>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
