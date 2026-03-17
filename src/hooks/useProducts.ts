"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import type { Product } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (!error && data) {
      setProducts(data.map((d) => snakeToCamel<Product>(d)));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addProduct(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) {
    const newProduct = {
      ...product,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    const { error } = await supabase
      .from("products")
      .insert(camelToSnake(newProduct as unknown as Record<string, unknown>));
    if (!error) {
      setProducts((prev) => [...prev, newProduct as Product]);
    }
    return !error;
  }

  async function updateProduct(product: Product) {
    const updated = { ...product, updatedAt: now() };
    const { error } = await supabase
      .from("products")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", product.id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
    }
    return !error;
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
    return !error;
  }

  async function decrementStock(productId: string, amount: number) {
    const { data, error } = await supabase.rpc("decrement_stock", {
      p_id: productId,
      amount,
    });
    if (!error && data > 0) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, qty: p.qty - amount } : p
        )
      );
      return true;
    }
    return false;
  }

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementStock,
    refetch: fetch,
  };
}
