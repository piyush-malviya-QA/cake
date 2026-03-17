"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, uid, now } from "@/lib/utils";
import type { Order, OrderItem, CartItem } from "@/types";

interface CreateOrderInput {
  items: CartItem[];
  subtotal: number;
  discountAmt: number;
  total: number;
  customerId: string | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) {
      setOrders(
        data.map((d) => {
          const { order_items, ...rest } = d;
          const order = snakeToCamel<Order>(rest as Record<string, unknown>);
          order.items = (order_items || []).map((oi: Record<string, unknown>) =>
            snakeToCamel<OrderItem>(oi)
          );
          return order;
        })
      );
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function createOrder(input: CreateOrderInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const orderId = uid();
    const orderData = {
      id: orderId,
      customer_id: input.customerId,
      subtotal: input.subtotal,
      discount_amt: input.discountAmt,
      total: input.total,
      created_by: user.id,
      created_at: now(),
    };

    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderData);
    if (orderError) return null;

    const itemsData = input.items.map((item) => ({
      id: uid(),
      order_id: orderId,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsData);
    if (itemsError) return null;

    const newOrder: Order = {
      id: orderId,
      customerId: input.customerId,
      subtotal: input.subtotal,
      discountAmt: input.discountAmt,
      total: input.total,
      createdBy: user.id,
      createdAt: orderData.created_at,
      items: itemsData.map((i) => snakeToCamel<OrderItem>(i as unknown as Record<string, unknown>)),
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
    return !error;
  }

  return { orders, loading, createOrder, deleteOrder, refetch: fetch };
}
