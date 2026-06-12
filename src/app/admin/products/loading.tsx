/** Skeleton loader for /admin/products */
export default function ProductsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-28 rounded bg-black/[0.07]" />
          <div className="h-3.5 w-20 rounded bg-black/[0.04]" />
        </div>
        <div className="h-9 w-32 rounded bg-black/[0.07]" />
      </div>

      {/* Legend bar */}
      <div className="flex gap-5 h-10 rounded bg-black/[0.03] px-4 items-center">
        {[50, 70, 55, 45].map((w, i) => (
          <div key={i} className="h-3 rounded bg-black/[0.06]" style={{ width: w }} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="h-9 w-60 rounded bg-black/[0.05]" />
        <div className="h-9 w-40 rounded bg-black/[0.04]" />
        <div className="h-9 w-36 rounded bg-black/[0.04]" />
        <div className="h-9 w-20 rounded bg-black/[0.07]" />
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 bg-gray-50 flex gap-8">
          {[70, 90, 55, 55, 70, 55, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-black/[0.08]" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-black/[0.04]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-10 h-12 rounded bg-black/[0.06] shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-3.5 w-36 rounded bg-black/[0.06]" />
                <div className="h-3 w-20 rounded bg-black/[0.04]" />
              </div>
              <div className="h-3.5 w-20 rounded bg-black/[0.05]" />
              <div className="h-3.5 w-14 rounded bg-black/[0.04]" />
              <div className="h-3.5 w-12 rounded bg-black/[0.05]" />
              <div className="h-5 w-20 rounded-full bg-black/[0.05]" />
              <div className="h-3.5 w-24 rounded bg-black/[0.04] ml-auto" />
              <div className="h-7 w-7 rounded bg-black/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
