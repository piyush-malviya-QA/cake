"use client";

import { useDataContext } from "@/features/data/DataProvider";

export function useCategories() {
  const ctx = useDataContext();
  return {
    categories: ctx.categories,
    loading: ctx.categoriesLoading,
    addCategory: ctx.addCategory,
    updateCategory: ctx.updateCategory,
    deleteCategory: ctx.deleteCategory,
    refetch: ctx.refetchCategories,
  };
}
