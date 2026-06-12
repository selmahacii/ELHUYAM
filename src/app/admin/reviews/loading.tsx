/** Skeleton loader for /admin/reviews */
export default function ReviewsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-16 rounded bg-black/[0.07]" />
          <div className="h-3.5 w-20 rounded bg-black/[0.04]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-black/10 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-black/[0.06] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 rounded bg-black/[0.06]" />
                <div className="h-3 w-20 rounded bg-black/[0.04]" />
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-3.5 h-3.5 rounded bg-black/[0.06]" />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-black/[0.04]" />
              <div className="h-3 w-4/5 rounded bg-black/[0.03]" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded bg-black/[0.05]" />
              <div className="h-7 w-20 rounded bg-black/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
