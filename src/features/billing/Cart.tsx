"use client";

import { useState, useMemo } from "react";
import { Minus, Plus, Trash2, Search, UserCheck, UserPlus, Bike } from "lucide-react";
import Button from "@/components/ui/Button";
import { fmt } from "@/lib/utils";
import type { CartItem, Customer } from "@/types";

interface CartProps {
  cart: CartItem[];
  customers: Customer[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (
    customerId: string | null,
    discountAmt: number,
    deliveryCharge: number,
    newCustomer?: { name: string; phone: string }
  ) => void;
}

export default function Cart({
  cart,
  customers,
  onUpdateQty,
  onRemove,
  onCheckout,
}: CartProps) {
  const [discount, setDiscount] = useState<string>("0");
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [deliveryCharge, setDeliveryCharge] = useState<string>("0");
  const [phone, setPhone] = useState("");
  const [newName, setNewName] = useState("");

  const matchedCustomer = useMemo(() => {
    if (phone.length < 3) return null;
    return customers.find((c) => c.phone.includes(phone)) ?? null;
  }, [phone, customers]);

  const isNewCustomer = phone.length >= 10 && !matchedCustomer;

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt =
    discountType === "percent"
      ? subtotal * (Number(discount) / 100)
      : Number(discount);
  const deliveryAmt = Math.max(0, Number(deliveryCharge) || 0);
  const total = Math.max(0, subtotal - discountAmt + deliveryAmt);

  function handleCheckout() {
    if (cart.length === 0) return alert("Cart is empty");
    if (isNewCustomer) {
      onCheckout(null, discountAmt, deliveryAmt, {
        name: newName.trim() || "Customer",
        phone: phone.trim(),
      });
    } else {
      onCheckout(matchedCustomer?.id ?? null, discountAmt, deliveryAmt);
    }
    setDiscount("0");
    setDeliveryCharge("0");
    setPhone("");
    setNewName("");
  }

  return (
    <div className="bg-white rounded-[10px] border border-slate-200 p-4 flex flex-col">
      <h3 className="m-0 mb-3 text-[15px] font-bold text-slate-800">
        🛒 Cart ({cart.length})
      </h3>

      {/* Customer phone lookup */}
      <div className="mb-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="Customer mobile number"
            maxLength={10}
            className="w-full pl-8 pr-3 py-2 border-[1.5px] border-slate-200 rounded-lg text-[13px] bg-slate-50 box-border outline-none focus:border-indigo-500"
          />
        </div>

        {/* Matched customer */}
        {matchedCustomer && (
          <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="text-[12px] font-semibold text-emerald-700">
              {matchedCustomer.name}
            </span>
            <span className="text-[11px] text-emerald-500">
              {matchedCustomer.phone}
            </span>
          </div>
        )}

        {/* New customer */}
        {isNewCustomer && (
          <div className="mt-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg mb-1.5">
              <UserPlus size={14} className="text-amber-600 shrink-0" />
              <span className="text-[12px] font-semibold text-amber-700">
                New Customer
              </span>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-2.5 py-1.5 border-[1.5px] border-slate-200 rounded-lg text-[12px] bg-slate-50 box-border outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-3">
        {cart.length === 0 && (
          <div className="p-8 text-center text-slate-300 text-[13px]">
            Add items to cart
          </div>
        )}
        {cart.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-2 py-2 border-b border-slate-100"
          >
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-800">
                {item.name}
              </div>
              <div className="text-xs text-slate-500">
                {fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQty(item.productId, -1)}
                className="bg-slate-100 border-none rounded-md w-[26px] h-[26px] cursor-pointer flex items-center justify-center"
              >
                <Minus size={14} />
              </button>
              <span className="text-[13px] font-bold min-w-[20px] text-center">
                {item.qty}
              </span>
              <button
                onClick={() => onUpdateQty(item.productId, 1)}
                className="bg-slate-100 border-none rounded-md w-[26px] h-[26px] cursor-pointer flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => onRemove(item.productId)}
              className="bg-transparent border-none cursor-pointer text-red-600 p-0.5"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Discount */}
      <div className="flex gap-2 mb-2.5 items-end">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
            DISCOUNT
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className="w-full px-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-sm box-border"
          />
        </div>
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}
          className="px-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-[13px]"
        >
          <option value="percent">%</option>
          <option value="flat">₹</option>
        </select>
      </div>

      {/* Delivery Charge */}
      <div className="flex gap-2 mb-2.5 items-end">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
            DELIVERY CHARGE
          </label>
          <div className="relative">
            <Bike size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-2.5 py-2 border-[1.5px] border-slate-200 rounded-lg text-sm box-border"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t-2 border-slate-200 pt-2.5 mb-3">
        <div className="flex justify-between text-[13px] text-slate-500 mb-1">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-[13px] text-red-600 mb-1">
            <span>Discount</span>
            <span>-{fmt(discountAmt)}</span>
          </div>
        )}
        {deliveryAmt > 0 && (
          <div className="flex justify-between text-[13px] text-blue-600 mb-1">
            <span>Delivery</span>
            <span>+{fmt(deliveryAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-extrabold text-slate-800">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <Button
        variant="success"
        onClick={handleCheckout}
        disabled={cart.length === 0}
        className="w-full justify-center py-3 text-[15px]"
      >
        Checkout
      </Button>
    </div>
  );
}
