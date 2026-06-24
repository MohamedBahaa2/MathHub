export const metadata = { title: "MathHub — Payments" };

const myPurchases = [
  { type: "course", name: "Calculus I", sessions: 5, price: "$45.00", date: "June 1, 2025", status: "Active" },
  { type: "session", name: "Differential Equations — Separable", price: "$18.00", date: "June 15, 2025", status: "Active" },
  { type: "session", name: "Linear Algebra — Eigenvalues", price: "$15.00", date: "June 23, 2025", status: "Active" },
];

const history = [
  { date: "June 23, 2025", desc: "Linear Algebra — Eigenvalues (1 Session)", amount: "$15.00", status: "Paid" },
  { date: "June 15, 2025", desc: "Differential Equations — Separable (1 Session)", amount: "$18.00", status: "Paid" },
  { date: "June 1, 2025",  desc: "Calculus I (Full Course — 5 Sessions)", amount: "$45.00", status: "Paid" },
];

export default function PaymentsPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">
          Your purchased sessions and courses. Buy more from the Sessions page.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
        {[
          { icon: "school",    label: "Courses Purchased",  value: "1", color: "text-secondary", bg: "bg-secondary-light" },
          { icon: "play_circle", label: "Sessions Purchased", value: "2", color: "text-primary",   bg: "bg-primary-light" },
          { icon: "payments",  label: "Total Spent",         value: "$78", color: "text-[#8B6914]", bg: "bg-warning-light" },
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

      {/* My Purchases */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden mb-8 animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">My Purchases</h3>
          <a href="/sessions" className="text-sm font-bold text-secondary hover:opacity-70 transition-opacity">+ Buy more →</a>
        </div>
        <div className="divide-y divide-surface-high/60">
          {myPurchases.map((p, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5 hover:bg-white/30 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.type === "course" ? "bg-secondary-light text-secondary" : "bg-primary-light text-primary"}`}>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {p.type === "course" ? "school" : "play_circle"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-sm">{p.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {p.type === "course"
                    ? `Full Course · ${p.sessions} sessions`
                    : "Single Session"}
                  {" · "}Purchased {p.date}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-headline font-bold text-primary">{p.price}</p>
                <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high">
          <h3 className="font-headline font-bold text-lg">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low">
                {["Date", "Description", "Amount", "Status", "Receipt"].map(h => (
                  <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={i} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{t.desc}</td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">{t.amount}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">{t.status}</span>
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
