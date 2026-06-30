"use client";
import { useState, useEffect, useCallback } from "react";
import { payments as paymentsApi, wallet as walletApi } from "@/lib/api";

const STATUS_COLORS = {
  PAID: "bg-primary-light text-primary",
  PENDING: "bg-warning-light text-[#8B6914]",
  FAILED: "bg-danger-light text-danger",
  REFUNDED: "bg-secondary-light text-secondary",
};

function RefundModal({ target, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) { setError("Enter a valid refund amount"); return; }
    if (!description.trim()) { setError("Please enter a reason for the refund"); return; }
    setLoading(true); setError("");
    try {
      await walletApi.adminRefund(target.user.id, val, description.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[440px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-xl font-extrabold">Issue Refund</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-xs text-ink-muted mb-6">
          Crediting wallet of <span className="font-bold text-ink">{target.user.name}</span> — current balance: <span className="font-bold text-primary">${target.balance.toFixed(2)}</span>
        </p>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Refund Amount ($)</label>
            <input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-secondary-light text-center" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Reason</label>
            <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Reason for refund…"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary-light resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-br from-secondary to-secondary-container text-white font-headline font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? "Processing…" : "Issue Refund"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState("transactions");
  const [paymentsList, setPaymentsList] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [refundTarget, setRefundTarget] = useState(null);
  const [walletSearch, setWalletSearch] = useState("");

  useEffect(() => {
    paymentsApi.list()
      .then(d => setPaymentsList(d.payments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const data = await walletApi.adminList();
      setWallets(data.wallets || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "wallets") loadWallets();
  }, [tab, loadWallets]);

  const filtered = filter === "ALL" ? paymentsList : paymentsList.filter(p => p.status === filter);
  const totalEarned = paymentsList.filter(p => p.status === "PAID").reduce((s, p) => s + (p.amount ?? 0), 0);
  const pending = paymentsList.filter(p => p.status === "PENDING").reduce((s, p) => s + (p.amount ?? 0), 0);
  const failed = paymentsList.filter(p => p.status === "FAILED").length;

  const filteredWallets = wallets.filter(w =>
    !walletSearch || w.user?.name?.toLowerCase().includes(walletSearch.toLowerCase()) ||
    w.user?.email?.toLowerCase().includes(walletSearch.toLowerCase())
  );
  const totalWalletBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments & Wallets</h1>
        <p className="text-ink-muted text-base leading-relaxed">Track all transactions and manage student wallets.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { label: "Total Earned", value: loading ? "—" : `$${totalEarned.toFixed(2)}`, icon: "payments", color: "text-primary", bg: "bg-primary-light" },
          { label: "Pending Payments", value: loading ? "—" : `$${pending.toFixed(2)}`, icon: "pending", color: "text-[#8B6914]", bg: "bg-warning-light" },
          { label: "Wallet Funds Held", value: walletsLoading ? "—" : `$${totalWalletBalance.toFixed(2)}`, icon: "account_balance_wallet", color: "text-secondary", bg: "bg-secondary-light" },
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[["transactions", "Transactions"], ["wallets", "Student Wallets"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === key ? "bg-primary text-white shadow-primary" : "glass text-ink-muted hover:bg-surface-high"}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {tab === "transactions" && (
        <>
          <div className="flex gap-2 mb-5">
            {["ALL", "PAID", "PENDING", "FAILED"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${filter === f ? "bg-primary text-ink-on-primary shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-surface-high flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg">Transactions</h3>
              <span className="text-xs text-ink-muted font-semibold">{filtered.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-low">
                    {["Payment ID", "Student", "Type", "Amount", "Status", "Date"].map(h => (
                      <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="border-t border-surface-high/50">
                        {[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-20" /></td>)}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-ink-muted">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">receipt_long</span>
                      No transactions found.
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-white/30 transition-colors border-t border-surface-high/50">
                      <td className="px-6 py-4 text-xs font-mono text-ink-muted">{p.id.slice(0, 8)}…</td>
                      <td className="px-6 py-4 text-sm">{p.user?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.type === "COURSE" ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                          {p.type ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-headline font-bold text-primary">${(p.amount ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[p.status] ?? "bg-surface-high text-ink-muted"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "wallets" && (
        <div className="animate-fade-in-up">
          <div className="mb-4">
            <input value={walletSearch} onChange={e => setWalletSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full max-w-sm px-4 py-2.5 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light" />
          </div>
          <div className="glass rounded-2xl shadow-glass overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-high flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg">Student Wallets</h3>
              <span className="text-xs text-ink-muted">{filteredWallets.length} wallets · ${totalWalletBalance.toFixed(2)} total held</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-low">
                    {["Student", "Code / Email", "Balance", "Last Updated", ""].map(h => (
                      <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {walletsLoading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="border-t border-surface-high/50">
                        {[1, 2, 3, 4, 5].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-surface-low rounded animate-pulse w-24" /></td>)}
                      </tr>
                    ))
                  ) : filteredWallets.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-ink-muted">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">account_balance_wallet</span>
                      No wallets found.
                    </td></tr>
                  ) : filteredWallets.map(w => (
                    <tr key={w.id} className="hover:bg-white/30 transition-colors border-t border-surface-high/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{w.user?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted font-mono">{w.user?.studentCode || w.user?.email}</td>
                      <td className="px-6 py-4">
                        <span className="font-headline font-bold text-xl text-primary">${w.balance.toFixed(2)}</span>
                        <span className="text-xs text-ink-muted ml-1">{w.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{new Date(w.updatedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setRefundTarget(w)}
                          className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 ml-auto">
                          <span className="material-symbols-outlined text-sm">replay</span>
                          Refund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <RefundModal target={refundTarget} onClose={() => setRefundTarget(null)} onSuccess={loadWallets} />
      )}
    </>
  );
}
