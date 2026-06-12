"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface RevenuePoint { date: string; revenue: number; orders: number }
interface StatusBreakdown { status: string; count: number }

interface Props {
  revenueChart: RevenuePoint[];
  orderStatusBreakdown: StatusBreakdown[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#6366f1",
  SHIPPED: "#0ea5e9",
  OUT_FOR_DELIVERY: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#8a7560",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

function formatCurrency(v: number) {
  return `${v.toLocaleString()} DZD`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsCharts({ revenueChart, orderStatusBreakdown }: Props) {
  // Translate order breakdown labels for the Pie list
  const translatedBreakdown = orderStatusBreakdown.map((item) => ({
    ...item,
    translatedStatus: STATUS_LABELS[item.status] ?? item.status.replace(/_/g, " "),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Revenue Area Chart (Glassmorphism & Gold theme) */}
      <div className="lg:col-span-2 bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
          <h2 className="font-display text-sm font-bold text-slate-900">Revenue Chart</h2>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-2.5 py-0.5 rounded-lg shadow-2xs">
            Validated Revenue (DZD)
          </span>
        </div>
        
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d)}
              tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "bold" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "bold" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Revenue"]}
              labelFormatter={formatDate}
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0", 
                borderRadius: "12px", 
                fontSize: "11px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                fontWeight: "bold",
                color: "#0f172a"
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#A88244"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              activeDot={{ r: 5, fill: "#A88244", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Order Status Pie Chart (French & High Contrast) */}
      <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
          <h2 className="font-display text-sm font-bold text-slate-900">Order Distribution</h2>
          <span className="text-[10px] bg-slate-50 border border-slate-150 text-slate-500 font-bold px-2 py-0.5 rounded-lg shadow-2xs">
            By status
          </span>
        </div>
        
        {translatedBreakdown.length === 0 ? (
          <div className="flex items-center justify-center h-[240px] text-slate-400 text-xs font-semibold italic">
            No orders recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={translatedBreakdown}
                dataKey="count"
                nameKey="translatedStatus"
                cx="50%"
                cy="42%"
                outerRadius={70}
                strokeWidth={2}
                stroke="#fff"
              >
                {translatedBreakdown.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#ccc"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [v, name]}
                contentStyle={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0", 
                  borderRadius: "12px", 
                  fontSize: "11px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  fontWeight: "bold",
                  color: "#0f172a"
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ 
                  fontSize: "9.5px", 
                  color: "#475569", 
                  fontWeight: "bold", 
                  marginTop: "8px" 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
