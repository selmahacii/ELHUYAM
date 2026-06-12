/** Skeleton loader for /admin/customers */
export default function CustomersLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-24 rounded bg-black/[0.07]" />
          <div className="h-3.5 w-20 rounded bg-black/[0.04]" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-72 rounded bg-black/[0.05]" />
        <div className="h-9 w-20 rounded bg-black/[0.07]" />
      </div>
      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 bg-gray-50 flex gap-8">
          {[90, 120, 80, 70, 80, 70].map((w, i) => (
            <div key={i} className="h-3 rounded bg-black/[0.08]" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-black/[0.04]">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-8 h-8 rounded-full bg-black/[0.06] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 rounded bg-black/[0.06]" />
                <div className="h-3 w-44 rounded bg-black/[0.04]" />
              </div>
              <div className="h-3.5 w-16 rounded bg-black/[0.05]" />
              <div className="h-3.5 w-20 rounded bg-black/[0.05]" />
              <div className="h-3.5 w-24 rounded bg-black/[0.04] ml-auto" />
              <div className="h-7 w-7 rounded bg-black/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
