export const metadata = { title: "MathHub Admin — Payments" };

const TRANSACTIONS = [
  { student: "Sara M.", plan: "Standard", amount: "$29.00", date: "June 23, 2025", status: "Paid" },
  { student: "Karim A.", plan: "Standard", amount: "$29.00", date: "June 22, 2025", status: "Paid" },
  { student: "Youssef A.", plan: "Basic", amount: "$15.00", date: "June 21, 2025", status: "Paid" },
  { student: "Omar S.", plan: "Premium", amount: "$49.00", date: "June 20, 2025", status: "Failed" },
];

export default function AdminPaymentsPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments & Plans</h1>
        <p className="text-ink-muted text-base leading-relaxed">Track revenue and manage subscription plans via PayTabs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { label: "Total Earned", value: "$4,820", icon: "payments", color: "text-primary", bg: "bg-primary-light" },
          { label: "This Month", value: "$1,218", icon: "calendar_today", color: "text-secondary", bg: "bg-secondary-light" },
          { label: "Pending", value: "$49", icon: "pending", color: "text-[#8B6914]", bg: "bg-warning-light" },
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

      {/* Transactions table */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high">
          <h3 className="font-headline font-bold text-lg">Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-low">
              {["Student", "Plan", "Amount", "Date", "Status", "Invoice"].map(h => <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>)}
            </tr></thead>
            <tbody>
              {TRANSACTIONS.map((t, i) => (
                <tr key={i} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 font-bold text-sm">{t.student}</td>
                  <td className="px-6 py-4 text-sm">{t.plan}</td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">{t.amount}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === "Paid" ? "bg-primary-light text-primary" : "bg-danger-light text-danger"}`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors">
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
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
