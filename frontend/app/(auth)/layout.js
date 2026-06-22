// Auth group layout — no sidebar/topbar, just centers content.
// Root layout already provides <html> and <body>, so we only return a wrapper here.
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      {children}
    </div>
  );
}
