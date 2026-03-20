"use client";

import { useDataContext } from "@/features/data/DataProvider";

export function useOrders() {
  const ctx = useDataContext();
  return {
    orders: ctx.orders,
    loading: ctx.ordersLoading,
    createOrder: ctx.createOrder,
    deleteOrder: ctx.deleteOrder,
    refetch: ctx.refetchOrders,
  };
}
