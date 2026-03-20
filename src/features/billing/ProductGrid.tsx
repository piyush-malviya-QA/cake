"use client";

import { fmt } from "@/lib/utils";
import type { Product, Category, CartItem } from "@/types";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  onAdd: (product: Product) => void;
}

export default function ProductGrid({ products, categories, cart, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full p-10 text-center text-slate-400">
        No products available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
      {products.map((p) => {
        const inCart = cart.find((c) => c.productId === p.id);
        const cat = categories.find((c) => c.id === p.catId);
        return (
          <div
            key={p.id}
            onClick={() => onAdd(p)}
            className={`bg-white rounded-[10px] p-3.5 cursor-pointer transition-all relative ${
              inCart
                ? "border-2 border-indigo-600"
                : "border-[1.5px] border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-[28px] mb-1.5">{cat?.icon || "📦"}</div>
            <div className="text-[13px] font-semibold text-slate-800 leading-tight">
              {p.name}
            </div>
            <div className="text-base font-extrabold text-indigo-600 mt-1">
              {fmt(p.sellPrice)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stock: {p.qty}</div>
            {inCart && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold">
                {inCart.qty}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
