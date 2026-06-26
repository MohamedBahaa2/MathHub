export default function RouteLoading() {
  return (
    <div className="animate-page-enter">
      <div className="mb-10">
        <div className="h-4 w-28 rounded-full bg-surface-high route-shimmer mb-4" />
        <div className="h-10 w-64 max-w-full rounded-2xl bg-surface-high route-shimmer" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-2xl p-6 shadow-glass">
            <div className="h-12 w-12 rounded-2xl bg-surface-high route-shimmer mb-5" />
            <div className="h-4 w-24 rounded-full bg-surface-high route-shimmer mb-3" />
            <div className="h-7 w-16 rounded-xl bg-surface-high route-shimmer" />
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 shadow-glass">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-40 rounded-xl bg-surface-high route-shimmer" />
          <div className="h-9 w-24 rounded-xl bg-surface-high route-shimmer" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4">
              <div className="h-12 rounded-xl bg-surface-high route-shimmer" />
              <div className="h-12 rounded-xl bg-surface-high route-shimmer" />
              <div className="h-12 rounded-xl bg-surface-high route-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
