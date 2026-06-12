/** Skeleton loader for /admin/categories */
export default function CategoriesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-32 rounded bg-black/[0.07]" />
          <div className="h-3.5 w-24 rounded bg-black/[0.04]" />
        </div>
        <div className="h-9 w-36 rounded bg-black/[0.07]" />
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 bg-gray-50 flex gap-8">
          {[50, 80, 100, 70, 70, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-black/[0.08]" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-black/[0.04]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="w-10 h-10 rounded bg-black/[0.06] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 rounded bg-black/[0.06]" />
                <div className="h-3 w-20 rounded bg-black/[0.04]" />
              </div>
              <div className="h-3.5 w-24 rounded bg-black/[0.05]" />
              <div className="h-3.5 w-12 rounded bg-black/[0.04]" />
              <div className="h-5 w-16 rounded-full bg-black/[0.05]" />
              <div className="flex gap-1.5 ml-auto">
                <div className="h-7 w-7 rounded bg-black/[0.05]" />
                <div className="h-7 w-7 rounded bg-black/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
