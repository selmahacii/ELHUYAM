export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-brand-100/60" />
          <div className="h-4 w-16 bg-brand-100/40" />
        </div>
        <div className="h-10 w-44 bg-brand-100/50" />
      </div>

      {/* Search form skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-80 bg-brand-100/40 border border-brand-100/30" />
        <div className="h-9 w-20 bg-brand-100/50" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-brand-100/20 pb-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-brand-100/30" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-brand-100/40 overflow-hidden">
        <div className="h-10 bg-brand-50/50 border-b border-brand-100/30" />
        <div className="p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-brand-50/50 last:border-b-0 gap-4">
              <div className="h-12 w-10 bg-brand-100/30 shrink-0" />
              <div className="h-4 w-28 bg-brand-100/50" />
              <div className="h-4 w-40 bg-brand-100/40" />
              <div className="h-4 w-16 bg-brand-100/60" />
              <div className="h-4 w-16 bg-brand-100/50" />
              <div className="h-6 w-20 bg-brand-50" />
              <div className="h-6 w-24 bg-brand-50" />
              <div className="h-4 w-24 bg-brand-100/30" />
              <div className="h-8 w-8 bg-brand-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
