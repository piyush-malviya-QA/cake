"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, fmt } from "@/lib/utils";
import { useDataContext } from "@/features/data/DataProvider";
import type { Order, OrderItem } from "@/types";

interface FullOrderItem extends OrderItem {
  catId: string;
  categoryName: string;
}

interface FullOrder extends Order {
  fullItems: FullOrderItem[];
}

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InsightsModule() {
  const { products, categories, productsLoading, categoriesLoading } = useDataContext();
  const [allOrders, setAllOrders] = useState<FullOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const supabase = createClient();

  // Insights needs ALL orders (no limit) — fetched independently
  const fetchAllOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setAllOrders(
        data.map((d) => {
          const { order_items, ...rest } = d;
          const order = snakeToCamel<Order>(rest as Record<string, unknown>);
          const items = (order_items || []).map(
            (oi: Record<string, unknown>) => snakeToCamel<OrderItem>(oi)
          );
          return { ...order, items, fullItems: [] } as FullOrder;
        })
      );
    }
    setOrdersLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // Enrich orders with product/category info from shared context
  const orders = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.id, p]));
    return allOrders.map((o) => {
      const fullItems = o.items.map((item) => {
        const prod = item.productId ? prodMap.get(item.productId) : null;
        return {
          ...item,
          buyPrice: prod?.buyPrice ?? 0,
          catId: prod?.catId ?? "",
          categoryName:
            categories.find((c) => c.id === prod?.catId)?.name ?? "Unknown",
        } as FullOrderItem;
      });
      return { ...o, fullItems } as FullOrder;
    });
  }, [allOrders, products, categories]);

  const loading = ordersLoading || productsLoading || categoriesLoading;

  // Available months
  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentMonthKey());
    orders.forEach((o) => set.add(getMonthKey(o.createdAt)));
    return Array.from(set).sort().reverse();
  }, [orders]);

  // Orders for selected month
  const monthOrders = useMemo(
    () => orders.filter((o) => getMonthKey(o.createdAt) === selectedMonth),
    [orders, selectedMonth]
  );

  // Panel 1: Daily Sales
  const dailySales = useMemo(() => {
    const map = new Map<number, number>();
    monthOrders.forEach((o) => {
      const day = new Date(o.createdAt).getDate();
      map.set(day, (map.get(day) || 0) + o.total);
    });
    const [y, m] = selectedMonth.split("-");
    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      revenue: map.get(i + 1) || 0,
    }));
  }, [monthOrders, selectedMonth]);

  // Panel 2: Month-to-Month Summary
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      { revenue: number; buyCost: number; profit: number }
    >();
    orders.forEach((o) => {
      const key = getMonthKey(o.createdAt);
      const entry = map.get(key) || { revenue: 0, buyCost: 0, profit: 0 };
      entry.revenue += o.total;
      o.fullItems.forEach((item) => {
        entry.buyCost += item.buyPrice * item.qty;
      });
      entry.profit = entry.revenue - entry.buyCost;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        month: getMonthLabel(key),
        revenue: Number(v.revenue.toFixed(2)),
        buyCost: Number(v.buyCost.toFixed(2)),
        profit: Number(v.profit.toFixed(2)),
      }));
  }, [orders]);

  // Panel 3: Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthOrders.forEach((o) => {
      o.fullItems.forEach((item) => {
        const cat = item.categoryName;
        map.set(cat, (map.get(cat) || 0) + item.price * item.qty);
      });
    });
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [monthOrders]);

  // Panel 4: Item Drill-down
  const itemDrilldown = useMemo(() => {
    if (!selectedCategory) return [];
    const map = new Map<
      string,
      { name: string; units: number; revenue: number; profit: number }
    >();
    monthOrders.forEach((o) => {
      o.fullItems
        .filter((item) => item.categoryName === selectedCategory)
        .forEach((item) => {
          const entry = map.get(item.name) || {
            name: item.name,
            units: 0,
            revenue: 0,
            profit: 0,
          };
          entry.units += item.qty;
          entry.revenue += item.price * item.qty;
          entry.profit += (item.price - item.buyPrice) * item.qty;
          map.set(item.name, entry);
        });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [monthOrders, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-slate-400">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Month Selector */}
      <select
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
          setSelectedCategory(null);
        }}
        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {getMonthLabel(m)}
          </option>
        ))}
      </select>

      {/* Panel 1: Daily Sales Chart */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Daily Sales</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip cursor={false} formatter={(value: unknown) => [fmt(Number(value)), "Revenue"]} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} activeBar={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Panel 2: Month-to-Month Summary */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3">
          Month-to-Month Summary
        </h2>
        {monthlySummary.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={false} formatter={(value: unknown) => fmt(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="buyCost"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Buy Cost"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#059669"
                  strokeWidth={2}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 overflow-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-slate-50">
                    {["Month", "Revenue", "Buy Cost", "Profit"].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((row) => (
                    <tr key={row.month} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700 font-medium">
                        {row.month}
                      </td>
                      <td className="px-3 py-2 text-indigo-600 font-bold">
                        {fmt(row.revenue)}
                      </td>
                      <td className="px-3 py-2 text-red-500">
                        {fmt(row.buyCost)}
                      </td>
                      <td className="px-3 py-2 text-emerald-600 font-bold">
                        {fmt(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No data yet</p>
        )}
      </div>

      {/* Panel 3: Category Breakdown */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-700 mb-3">
          Category Breakdown — {getMonthLabel(selectedMonth)}
        </h2>
        {categoryBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip cursor={false} formatter={(value: unknown) => [fmt(Number(value)), "Revenue"]} />
              <Bar
                dataKey="revenue"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                activeBar={false}
                onClick={(data) => setSelectedCategory(data.name ?? null)}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400">No orders this month</p>
        )}
      </div>

      {/* Panel 4: Item Drill-down */}
      {selectedCategory && (
        <div className="bg-white rounded-[10px] border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">
              {selectedCategory} — Item Details
            </h2>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
            >
              Clear
            </button>
          </div>
          {itemDrilldown.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-slate-50">
                    {["Product Name", "Units Sold", "Revenue", "Profit"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {itemDrilldown.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700 font-medium">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{row.units}</td>
                      <td className="px-3 py-2 text-indigo-600 font-bold">
                        {fmt(row.revenue)}
                      </td>
                      <td className="px-3 py-2 text-emerald-600 font-bold">
                        {fmt(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No items in this category for the selected month
            </p>
          )}
        </div>
      )}
    </div>
  );
}
