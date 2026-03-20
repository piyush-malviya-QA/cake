"use client";

import { useState, useMemo } from "react";
import { Printer, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import ReceiptView from "./ReceiptView";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { fmt } from "@/lib/utils";
import type { Order } from "@/types";

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function OrdersModule() {
  const { orders, deleteOrder } = useOrders();
  const { customers } = useCustomers();
  const { role } = useAuthContext();
  const isAdmin = role === "admin";
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  // Available months from order data + current month
  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentMonthKey());
    orders.forEach((o) => set.add(getMonthKey(o.createdAt)));
    return Array.from(set).sort().reverse();
  }, [orders]);

  // Filtered orders for selected month
  const filtered = useMemo(
    () => orders.filter((o) => getMonthKey(o.createdAt) === selectedMonth),
    [orders, selectedMonth]
  );

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const totalDiscount = filtered.reduce((s, o) => s + o.discountAmt, 0);
  const totalBuyCost = filtered.reduce(
    (s, o) => s + o.items.reduce((si, item) => si + item.buyPrice * item.qty, 0),
    0
  );
  const allBuyPriceZero = filtered.length > 0 && filtered.every((o) =>
    o.items.every((item) => item.buyPrice === 0)
  );
  const profit = totalRevenue - totalBuyCost;

  return (
    <div>
      {/* Month Filter */}
      <div className="mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {getMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-5">
        <StatCard label="Total Orders" value={filtered.length} color="#6366f1" />
        <StatCard label="Revenue" value={fmt(totalRevenue)} color="#059669" />
        <StatCard label="Discounts Given" value={fmt(totalDiscount)} color="#f59e0b" />
        <StatCard
          label="Buy Cost"
          value={allBuyPriceZero ? "—" : fmt(totalBuyCost)}
          color="#ef4444"
        />
        <StatCard
          label="Profit"
          value={allBuyPriceZero ? "—" : fmt(profit)}
          color={profit >= 0 ? "#059669" : "#ef4444"}
        />
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {["Order ID", "Date", "Customer", "Items", "Discount", "Total", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const cust = customers.find((c) => c.id === o.customerId);
              return (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="px-3.5 py-2.5 font-mono text-xs text-slate-500">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {new Date(o.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-800">
                    {cust?.name || "Walk-in"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {o.items.length} items
                  </td>
                  <td
                    className={`px-3.5 py-2.5 ${
                      o.discountAmt > 0 ? "text-red-600" : "text-slate-400"
                    }`}
                  >
                    {o.discountAmt > 0 ? `-${fmt(o.discountAmt)}` : "—"}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-emerald-600">
                    {fmt(o.total)}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <Button small variant="ghost" onClick={() => setShowReceipt(o)}>
                      <Printer size={14} /> View
                    </Button>
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm("Delete this order?")) await deleteOrder(o.id);
                        }}
                        className="bg-transparent border-none cursor-pointer text-red-600 p-1 ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400">
                  No orders this month
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!showReceipt}
        onClose={() => setShowReceipt(null)}
        title="Order Receipt"
        wide
      >
        {showReceipt && (
          <ReceiptView order={showReceipt} customers={customers} />
        )}
      </Modal>
    </div>
  );
}
