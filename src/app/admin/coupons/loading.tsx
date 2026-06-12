/** Skeleton loader for /admin/coupons */
export default function CouponsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-36 rounded bg-black/[0.07]" />
          <div className="h-3.5 w-24 rounded bg-black/[0.04]" />
        </div>
        <div className="h-9 w-32 rounded bg-black/[0.07]" />
      </div>
      <div className="bg-white border border-black/10 overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 bg-gray-50 flex gap-8">
          {[80, 70, 60, 80, 70, 60, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-black/[0.08]" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-black/[0.04]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 w-28 rounded bg-black/[0.08] font-mono" />
              <div className="h-3.5 w-16 rounded bg-black/[0.05]" />
              <div className="h-3.5 w-20 rounded bg-black/[0.04]" />
              <div className="h-3.5 w-20 rounded bg-black/[0.04]" />
              <div className="h-5 w-14 rounded-full bg-black/[0.05]" />
              <div className="h-3 w-20 rounded bg-black/[0.04] ml-auto" />
              <div className="flex gap-1">
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
