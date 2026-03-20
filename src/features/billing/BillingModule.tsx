"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import Modal from "@/components/ui/Modal";
import CategoryTabs from "./CategoryTabs";
import ProductGrid from "./ProductGrid";
import Cart from "./Cart";
import ReceiptView from "@/features/orders/ReceiptView";
import { createClient } from "@/lib/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import type { Product, Order, CartItem } from "@/types";

export default function BillingModule() {
  const { products, refetch: refetchProducts } = useProducts();
  const { categories } = useCategories();
  const { customers, addCustomer } = useCustomers();
  const { createOrder } = useOrders();

  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);

  const available = products.filter(
    (p) =>
      p.qty > 0 &&
      (activeCat === "all" || p.catId === activeCat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.qty) return prev;
        return prev.map((c) =>
          c.productId === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.sellPrice,
          qty: 1,
          maxQty: product.qty,
        },
      ];
    });
  }

  function updateCartQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const newQty = c.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > c.maxQty) return c;
          return { ...c, qty: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  async function handleCheckout(
    customerId: string | null,
    discountAmt: number,
    deliveryCharge: number,
    newCustomer?: { name: string; phone: string }
  ) {
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const total = Math.max(0, subtotal - discountAmt + deliveryCharge);

    // Atomic stock decrement — all or nothing
    const supabase = createClient();
    const { error: stockError } = await supabase.rpc(
      "checkout_decrement_stock",
      {
        item_ids: cart.map((c) => c.productId),
        item_amounts: cart.map((c) => c.qty),
      }
    );
    if (stockError) {
      alert("Insufficient stock for one or more items. Please review your cart.");
      return;
    }

    // Refresh products to reflect decremented stock from DB
    await refetchProducts();

    // Create new customer if needed
    let finalCustomerId = customerId;
    if (newCustomer) {
      const newId = await addCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: null,
      });
      if (newId) finalCustomerId = newId;
    }

    // Create order
    const order = await createOrder({
      items: cart,
      subtotal,
      discountAmt,
      deliveryCharge,
      total,
      customerId: finalCustomerId,
    });

    if (order) {
      setCart([]);
      setShowReceipt(order);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-[500px]">
      {/* Left: Product Selection */}
      <div>
        <CategoryTabs
          categories={categories}
          active={activeCat}
          onChange={setActiveCat}
        />
        <div className="mb-3.5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
          />
        </div>
        <ProductGrid
          products={available}
          categories={categories}
          cart={cart}
          onAdd={addToCart}
        />
      </div>

      {/* Right: Cart */}
      <Cart
        cart={cart}
        customers={customers}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Receipt Modal */}
      <Modal
        open={!!showReceipt}
        onClose={() => setShowReceipt(null)}
        title="Order Complete!"
        wide
      >
        {showReceipt && (
          <ReceiptView order={showReceipt} customers={customers} />
        )}
      </Modal>
    </div>
  );
}
