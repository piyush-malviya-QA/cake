"use client";

import { useRef } from "react";
import { Printer, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { fmt } from "@/lib/utils";
import { useAuthContext } from "@/features/auth/AuthProvider";
import type { Order, Customer } from "@/types";

interface ReceiptViewProps {
  order: Order;
  customers: Customer[];
}

export default function ReceiptView({ order, customers }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { shopName, shopAddress, shopPhone } = useAuthContext();
  const customer = customers.find((c) => c.id === order.customerId);

  const displayName = shopName || "Cakeifyy";
  const displayAddress = shopAddress || "";
  const displayPhone = shopPhone || "";

  function generateReceiptText() {
    let text = `${displayName}\n${"─".repeat(32)}\n`;
    text += `Bill #: ${order.id.toUpperCase()}\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleString("en-IN")}\n`;
    if (customer) text += `Customer: ${customer.name}\n`;
    text += `${"─".repeat(32)}\n`;
    order.items.forEach((item) => {
      text += `${item.name}\n  ${item.qty} x ${fmt(item.price)} = ${fmt(item.price * item.qty)}\n`;
    });
    text += `${"─".repeat(32)}\n`;
    text += `Subtotal: ${fmt(order.subtotal)}\n`;
    if (order.discountAmt > 0) text += `Discount: -${fmt(order.discountAmt)}\n`;
    if (order.deliveryCharge > 0) text += `Delivery: +${fmt(order.deliveryCharge)}\n`;
    text += `TOTAL: ${fmt(order.total)}\n`;
    text += `${"─".repeat(32)}\nThank you! Visit again 🎂`;
    return text;
  }

  function printReceipt() {
    const printWindow = window.open("", "_blank", "width=302,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 4mm; line-height: 1.4; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { font-weight: bold; }
        .total-row { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:16px">${displayName}</div>
        <div class="center" style="font-size:10px">${displayAddress}${displayPhone ? `<br>Phone: ${displayPhone}` : ""}</div>
        <div class="line"></div>
        <div class="row"><span>Bill #:</span><span>${order.id.toUpperCase().slice(0, 8)}</span></div>
        <div class="row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleString("en-IN")}</span></div>
        ${customer ? `<div class="row"><span>Customer:</span><span>${customer.name}</span></div>` : ""}
        <div class="line"></div>
        ${order.items.map((item) => `
          <div class="item-name">${item.name}</div>
          <div class="row"><span>${item.qty} x ${fmt(item.price)}</span><span>${fmt(item.price * item.qty)}</span></div>
        `).join("")}
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
        ${order.discountAmt > 0 ? `<div class="row"><span>Discount</span><span>-${fmt(order.discountAmt)}</span></div>` : ""}
        ${order.deliveryCharge > 0 ? `<div class="row"><span>Delivery</span><span>+${fmt(order.deliveryCharge)}</span></div>` : ""}
        <div class="line"></div>
        <div class="row total-row"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top:8px">Thank you! Visit again 🎂</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function sendWhatsApp() {
    const phone = customer?.phone || "";
    const text = encodeURIComponent(generateReceiptText());
    const url = phone
      ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      {/* Visual Receipt */}
      <div
        ref={receiptRef}
        className="bg-amber-50 border border-amber-200 rounded-[10px] p-5 font-mono text-[13px] max-w-[320px] mx-auto mb-4"
      >
        <div className="text-center font-extrabold text-base mb-1">{displayName}</div>
        <div className="text-center text-[10px] text-stone-500 mb-2">
          {displayAddress}{displayPhone ? ` • ${displayPhone}` : ""}
        </div>
        <div className="border-t border-dashed border-stone-300 my-2" />
        <div className="flex justify-between text-[11px] text-stone-500">
          <span>Bill #{order.id.slice(0, 8).toUpperCase()}</span>
          <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
        </div>
        {customer && <div className="text-xs mt-1">Customer: {customer.name}</div>}
        <div className="border-t border-dashed border-stone-300 my-2" />
        {order.items.map((item, i) => (
          <div key={i} className="mb-1">
            <div className="font-bold text-xs">{item.name}</div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>{item.qty} × {fmt(item.price)}</span>
              <span>{fmt(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
        <div className="border-t border-dashed border-stone-300 my-2" />
        <div className="flex justify-between text-xs">
          <span>Subtotal</span>
          <span>{fmt(order.subtotal)}</span>
        </div>
        {order.discountAmt > 0 && (
          <div className="flex justify-between text-xs text-red-600">
            <span>Discount</span>
            <span>-{fmt(order.discountAmt)}</span>
          </div>
        )}
        {order.deliveryCharge > 0 && (
          <div className="flex justify-between text-xs text-blue-600">
            <span>Delivery</span>
            <span>+{fmt(order.deliveryCharge)}</span>
          </div>
        )}
        <div className="border-t-2 border-stone-900 my-2" />
        <div className="flex justify-between text-lg font-extrabold">
          <span>TOTAL</span>
          <span>{fmt(order.total)}</span>
        </div>
        <div className="text-center text-[11px] text-stone-500 mt-2.5">
          Thank you! Visit again 🎂
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 justify-center flex-wrap">
        <Button variant="whatsapp" onClick={sendWhatsApp}>
          <MessageCircle size={18} /> Send WhatsApp
        </Button>
        <Button onClick={printReceipt}>
          <Printer size={18} /> Print Receipt
        </Button>
      </div>
    </div>
  );
}
