export default function AdminLoading() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Title block skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-brand-100/60" />
        <div className="h-4 w-64 bg-brand-100/40" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-brand-100/40 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-brand-100/50" />
                <div className="h-6 w-32 bg-brand-100/70" />
              </div>
              <div className="w-10 h-10 bg-brand-50" />
            </div>
            <div className="h-3 w-40 bg-brand-100/40" />
          </div>
        ))}
      </div>

      {/* Alerts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-16 bg-amber-50/40 border border-amber-100/30" />
        <div className="h-16 bg-rose-50/40 border border-rose-100/30" />
      </div>

      {/* Main section splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table skeleton */}
        <div className="lg:col-span-2 bg-white border border-brand-100/40">
          <div className="h-12 border-b border-brand-100/30 px-5 flex items-center justify-between">
            <div className="h-4 w-32 bg-brand-100/50" />
            <div className="h-3 w-16 bg-brand-100/40" />
          </div>
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-brand-50/50 last:border-b-0">
                <div className="h-4 w-24 bg-brand-100/50" />
                <div className="h-4 w-36 bg-brand-100/40" />
                <div className="h-4 w-16 bg-brand-100/60" />
                <div className="h-6 w-16 bg-brand-50" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side widgets skeleton */}
        <div className="space-y-5">
          <div className="bg-white border border-brand-100/40 p-5 space-y-4">
            <div className="h-4 w-28 bg-brand-100/50 pb-2 border-b border-brand-50" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-brand-100/40" />
                <div className="h-4 w-12 bg-brand-100/60" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-brand-100/40 p-5 space-y-4">
            <div className="h-4 w-28 bg-brand-100/50 pb-2 border-b border-brand-50" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-20 bg-brand-100/40" />
                <div className="h-6 w-12 bg-brand-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
