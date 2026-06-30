"use client";
import { useState, useEffect, useCallback } from "react";
import { wallet as walletApi } from "@/lib/api";

const TX_TYPE_STYLES = {
  TOP_UP: { color: "text-primary", bg: "bg-primary-light", icon: "add_circle", label: "Top Up" },
  PURCHASE: { color: "text-[#8B6914]", bg: "bg-warning-light", icon: "shopping_cart", label: "Purchase" },
  REFUND: { color: "text-secondary", bg: "bg-secondary-light", icon: "replay", label: "Refund" },
};
const STATUS_COLORS = {
  PAID: "bg-primary-light text-primary",
  PENDING: "bg-warning-light text-[#8B6914]",
  FAILED: "bg-danger-light text-danger",
  REFUNDED: "bg-secondary-light text-secondary",
};

function TopUpModal({ balance, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const presets = [10, 25, 50, 100, 200];

  async function handleSubmit(e) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val < 1) { setError("Minimum top-up is $1"); return; }
    setLoading(true); setError("");
    try {
      await walletApi.topUp(val);
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
      <div className="glass rounded-2xl shadow-elevated w-full max-w-[420px] p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-xl font-extrabold">Top Up Wallet</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-high">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-xs text-ink-muted mb-6">Current balance: <span className="font-bold text-ink">${balance.toFixed(2)}</span></p>
        {error && <div className="mb-4 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-2">
            {presets.map(p => (
              <button key={p} type="button" onClick={() => setAmount(String(p))}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${String(amount) === String(p) ? "bg-primary text-white shadow-primary" : "bg-surface-low text-ink-muted hover:bg-surface-high"}`}>
                ${p}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-muted block mb-1.5">Amount ($)</label>
            <input required type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full px-4 py-3 bg-surface-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-light text-center text-lg font-bold" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? "Processing…" : amount ? `Add $${Number(amount).toFixed(2)} to Wallet` : "Add to Wallet"}
          </button>
          <p className="text-center text-xs text-ink-muted">Payments are processed securely</p>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await walletApi.get();
      setWalletData(data.wallet);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const transactions = walletData?.transactions || [];
  const totalTopUps = transactions.filter(t => t.type === "TOP_UP").reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === "PURCHASE").reduce((s, t) => s + t.amount, 0);
  const totalRefunds = transactions.filter(t => t.type === "REFUND").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Wallet & Payments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Manage your wallet balance and view your transaction history.
        </p>
      </div>

      {error && <div className="mb-6 px-4 py-3 bg-danger-light text-danger rounded-xl text-sm">{error}</div>}

      {/* Wallet Balance Hero */}
      <div className="glass rounded-3xl p-8 shadow-elevated mb-8 animate-fade-in-up bg-gradient-to-br from-primary/10 to-secondary/5">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Wallet Balance</p>
            {loading ? (
              <div className="h-12 w-36 rounded-xl route-shimmer" />
            ) : (
              <p className="font-headline text-5xl font-extrabold text-ink">
                ${walletData?.balance.toFixed(2) ?? "0.00"}
                <span className="text-xl text-ink-muted ml-2 font-medium">{walletData?.currency || "USD"}</span>
              </p>
            )}
          </div>
          <button onClick={() => setShowTopUp(true)}
            className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-ink-on-primary font-headline font-bold rounded-xl shadow-primary hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all text-lg flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Top Up Wallet
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 stagger">
        {[
          { icon: "add_circle", label: "Total Topped Up", value: `$${totalTopUps.toFixed(2)}`, color: "text-primary", bg: "bg-primary-light" },
          { icon: "shopping_cart", label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, color: "text-[#8B6914]", bg: "bg-warning-light" },
          { icon: "replay", label: "Total Refunded", value: `$${totalRefunds.toFixed(2)}`, color: "text-secondary", bg: "bg-secondary-light" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-6 shadow-glass flex items-center gap-4 animate-fade-in-up">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-ink-muted font-medium">{s.label}</p>
              {loading ? <div className="h-5 w-20 rounded route-shimmer mt-1" /> : <p className="font-headline text-xl font-extrabold">{s.value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-surface-high flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg">Transaction History</h2>
          <span className="text-xs text-ink-muted">{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 flex flex-col gap-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl route-shimmer" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-ink-muted">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">account_balance_wallet</span>
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low text-[0.6875rem] uppercase tracking-widest text-ink-muted">
                  {["Type", "Description", "Amount", "Status", "Date"].map(h => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const style = TX_TYPE_STYLES[tx.type] || TX_TYPE_STYLES.PURCHASE;
                  const sign = tx.type === "PURCHASE" ? "-" : "+";
                  return (
                    <tr key={tx.id} className="border-t border-surface-high/50 hover:bg-white/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.color} shrink-0`}>
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
                          </div>
                          <span className={`text-xs font-bold ${style.color}`}>{style.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-muted max-w-[200px] truncate">{tx.description || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`font-headline font-bold text-sm ${tx.type === "PURCHASE" ? "text-danger" : "text-primary"}`}>
                          {sign}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-bold ${STATUS_COLORS[tx.status] || "bg-surface-high text-ink-muted"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-muted">{new Date(tx.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showTopUp && (
        <TopUpModal
          balance={walletData?.balance ?? 0}
          onClose={() => setShowTopUp(false)}
          onSuccess={load}
        />
      )}
    </>
  );
}
