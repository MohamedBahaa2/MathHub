export const metadata = { title: "MathHub Parent — Payments" };
const history = [
  { date: "June 23, 2025", desc: "Standard Plan — Sara Mohamed", amount: "$29.00", status: "Paid" },
  { date: "May 23, 2025", desc: "Standard Plan — Sara Mohamed", amount: "$29.00", status: "Paid" },
  { date: "June 23, 2025", desc: "Basic Plan — Omar Sayed", amount: "$15.00", status: "Paid" },
];

export default function ParentPaymentsPage() {
  return (
    <>
      <div className="mb-10 animate-fade-in-up">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight mb-2">Payments</h1>
        <p className="text-ink-muted text-base leading-relaxed">Subscription status and payment history for your children.</p>
      </div>
      <div className="glass rounded-2xl shadow-glass overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-surface-high">
          <h3 className="font-headline font-bold text-lg">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-low">
              {["Date", "Description", "Amount", "Status", "Receipt"].map(h => <th key={h} className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-ink-muted">{h}</th>)}
            </tr></thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={i} className="hover:bg-white/50 transition-colors border-t border-surface-high/50">
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{t.desc}</td>
                  <td className="px-6 py-4 font-headline font-bold text-primary">{t.amount}</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">{t.status}</span></td>
                  <td className="px-6 py-4"><button className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-primary hover:bg-primary-light transition-colors"><span className="material-symbols-outlined text-lg">download</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
