"use client";

import { useDataContext } from "@/features/data/DataProvider";

export function useProducts() {
  const ctx = useDataContext();
  return {
    products: ctx.products,
    loading: ctx.productsLoading,
    addProduct: ctx.addProduct,
    updateProduct: ctx.updateProduct,
    deleteProduct: ctx.deleteProduct,
    decrementStock: ctx.decrementStock,
    refetch: ctx.refetchProducts,
  };
}
