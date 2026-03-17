"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake } from "@/lib/utils";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (!error && data) {
      setCategories(data.map((d) => snakeToCamel<Category>(d)));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addCategory(category: Omit<Category, "sortOrder">) {
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const { error } = await supabase
      .from("categories")
      .insert(camelToSnake({ ...category, sortOrder: maxSort + 1 } as unknown as Record<string, unknown>));
    if (!error) await fetch();
    return !error;
  }

  async function updateCategory(category: Category) {
    const { error } = await supabase
      .from("categories")
      .update(camelToSnake(category as unknown as Record<string, unknown>))
      .eq("id", category.id);
    if (!error) await fetch();
    return !error;
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) await fetch();
    return !error;
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetch };
}
