"use client";
import { useState, useEffect } from "react";
import { payments as paymentsApi } from "@/lib/api";

const STATUS_COLORS = {
  PAID: "bg-primary-light text-primary",
  PENDING: "bg-warning-light text-[#8B6914]",
  FAILED: "bg-danger-light text-danger",
};

export default function AdminPaymentsPage() {
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    paymentsApi.list()
      .then(d => setPaymentsList(d.payments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? paymentsList : paymentsList.filter(p => p.status === filter);

  const totalEarned = paymentsList.filter(p => p.status === "PAID").reduce((s, p) => s + (p.amount ?? 0), 0);
  const pending = paymentsList.filter(p => p.status === "PENDING").reduce((s, p) => s + (p.amount ?? 0), 0);
  const failed = paymentsList.filter(p => p.status === "FAILED").length;

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments & Revenue</h1>
        <p className="text-ink-muted text-base leading-relaxed">Track all transactions from students via PayTabs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { label: "Total Earned", value: loading ? "—" : `$${totalEarned.toFixed(2)}`, icon: "payments", color: "text-primary", bg: "bg-primary-light" },
          { label: "Pending", value: loading ? "—" : `$${pending.toFixed(2)}`, icon: "pending", color: "text-[#8B6914]", bg: "bg-warning-light" },
          { label: "Failed Transactions", value: loading ? "—" : failed, icon: "cancel", color: "text-danger", bg: "bg-danger-light" },
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

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PAID", "PENDING", "FAILED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${filter === f ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {/* Transactions table */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">Transactions</h3>
          <span className="text-xs text-ink-muted font-semibold">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["Payment ID", "Type", "Amount", "Currency", "Status", "Date", "PayTabs Ref"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="border-t border-surface-high/50">
                    {[1,2,3,4,5,6,7].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-ink-muted">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">receipt_long</span>
                    No transactions found.
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 text-xs font-mono text-ink-muted">{p.id.slice(0, 8)}…</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.type === "COURSE" ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                      {p.type ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">${(p.amount ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{p.currency ?? "USD"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status] ?? "bg-surface-high text-ink-muted"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-muted">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-ink-muted">
                    {p.paytabsRef ? p.paytabsRef.slice(0, 12) + "…" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
