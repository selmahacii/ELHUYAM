/**
 * Ultra-lightweight Skeleton system for admin module.
 * Uses CSS-only shimmer — zero JS overhead, renders before hydration.
 */
import React from "react";

// ── Base shimmer block ───────────────────────────────────────────────────────
export function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-gradient-to-r from-black/[0.05] via-black/[0.08] to-black/[0.05] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] rounded-sm ${className}`}
      style={style}
    />
  );
}

// ── Page header skeleton ─────────────────────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Shimmer className="h-7 w-40" />
        <Shimmer className="h-4 w-24" />
      </div>
      <Shimmer className="h-9 w-36" />
    </div>
  );
}

// ── KPI cards skeleton ───────────────────────────────────────────────────────
export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-7 w-20" />
            </div>
            <Shimmer className="h-10 w-10" />
          </div>
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ── Data table skeleton ──────────────────────────────────────────────────────
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-3.5 bg-gray-50 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-3" style={{ width: `${60 + (i % 3) * 30}px` }} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Shimmer className="h-3.5 w-24" />
            <Shimmer className="h-3.5 w-32" />
            <Shimmer className="h-3.5 w-16" />
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-3.5 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Product grid skeleton ────────────────────────────────────────────────────
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 overflow-hidden">
          <Shimmer className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Shimmer className="h-3.5 w-full" />
            <Shimmer className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-1">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card sidebar skeleton ───────────────────────────────────────────────
export function StatSidebarSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-6 w-12 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

// ── Full dashboard skeleton (instant first paint) ────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <PageHeaderSkeleton />
      <KpiCardsSkeleton count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Shimmer className="h-16" />
        <Shimmer className="h-16" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TableSkeleton rows={6} cols={5} />
        </div>
        <div className="space-y-5">
          <div className="bg-white border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <Shimmer className="h-4 w-32" />
            </div>
            <StatSidebarSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
