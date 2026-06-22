export const metadata = { title: "MathHub — Payments" };

const plan = { name: "Standard Plan", price: "$29/month", renewal: "July 23, 2025", status: "Active" };
const history = [
  { date: "June 23, 2025", desc: "Standard Plan — Monthly", amount: "$29.00", status: "Paid" },
  { date: "May 23, 2025", desc: "Standard Plan — Monthly", amount: "$29.00", status: "Paid" },
  { date: "Apr 23, 2025", desc: "Standard Plan — Monthly", amount: "$29.00", status: "Paid" },
];

const PLANS = [
  { name: "Basic", price: "$15", period: "/month", features: ["5 sessions/month", "Assignment uploads", "Basic analytics"], highlight: false },
  { name: "Standard", price: "$29", period: "/month", features: ["Unlimited sessions", "Assignments & quizzes", "Full analytics", "Help requests"], highlight: true },
  { name: "Premium", price: "$49", period: "/month", features: ["Everything in Standard", "1-on-1 sessions", "Priority support", "Parent reports"], highlight: false },
];

export default function PaymentsPage() {
  const isSubscribed = true;
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments</h1>
        <p className="text-ink-muted text-base max-w-[600px] leading-relaxed">Manage your subscription and view payment history.</p>
      </div>

      {isSubscribed ? (
        <div className="glass rounded-2xl p-8 shadow-glass mb-8 animate-fade-in-up flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-muted">Current Plan</span>
            <h2 className="font-headline text-2xl font-extrabold mt-1 mb-1">{plan.name}</h2>
            <p className="text-ink-muted text-sm">Renews on <strong className="text-ink">{plan.renewal}</strong></p>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 bg-primary-light text-primary text-sm font-bold rounded-full">{plan.status}</span>
            <span className="font-headline text-3xl font-extrabold text-primary">{plan.price}</span>
            <button className="px-5 py-2.5 border border-surface-high text-ink-muted text-sm font-bold rounded-xl hover:border-primary hover:text-primary transition-colors">Manage</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 stagger">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-2xl p-8 flex flex-col shadow-glass animate-fade-in-up ${p.highlight ? "bg-gradient-to-br from-primary to-primary-container text-white" : "glass"}`}>
              {p.highlight && <span className="text-[0.625rem] font-bold uppercase tracking-widest text-white/70 mb-2">Most Popular</span>}
              <h3 className={`font-headline text-xl font-extrabold mb-1 ${p.highlight ? "text-white" : ""}`}>{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`font-headline text-4xl font-extrabold ${p.highlight ? "text-white" : "text-primary"}`}>{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-white/70" : "text-ink-muted"}`}>{p.period}</span>
              </div>
              <ul className="flex flex-col gap-2 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-white/90" : "text-ink-muted"}`}>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 font-headline font-bold rounded-xl active:scale-95 transition-all ${p.highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white shadow-primary hover:brightness-110"}`}>
                Subscribe via PayTabs
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment History */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high">
          <h3 className="font-headline font-bold text-lg">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-low">
              {["Date", "Description", "Amount", "Status", "Receipt"].map((h) => (
                <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={i} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{t.desc}</td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">{t.amount}</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">{t.status}</span></td>
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
