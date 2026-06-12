/** Skeleton loader for /admin/analytics */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-7 w-36 rounded bg-black/[0.07]" />
        <div className="h-3.5 w-48 rounded bg-black/[0.04]" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-black/10 p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-black/[0.06]" />
            <div className="h-8 w-24 rounded bg-black/[0.08]" />
            <div className="h-3 w-16 rounded bg-black/[0.04]" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[300, 250].map((h, i) => (
          <div key={i} className="bg-white border border-black/10 p-5 space-y-3" style={{ height: h }}>
            <div className="h-4 w-32 rounded bg-black/[0.06]" />
            <div className="flex-1 rounded bg-black/[0.03] mt-4" style={{ height: h - 60 }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 bg-gray-50 flex gap-8">
          {[90, 70, 60, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-black/[0.08]" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-black/[0.04]">
            <div className="h-3.5 w-32 rounded bg-black/[0.06]" />
            <div className="h-3.5 w-20 rounded bg-black/[0.05] ml-auto" />
            <div className="h-3.5 w-16 rounded bg-black/[0.04]" />
            <div className="h-3.5 w-16 rounded bg-black/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
