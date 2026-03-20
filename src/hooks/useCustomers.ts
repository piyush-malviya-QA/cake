"use client";

import { useDataContext } from "@/features/data/DataProvider";

export function useCustomers() {
  const ctx = useDataContext();
  return {
    customers: ctx.customers,
    loading: ctx.customersLoading,
    addCustomer: ctx.addCustomer,
    updateCustomer: ctx.updateCustomer,
    deleteCustomer: ctx.deleteCustomer,
    refetch: ctx.refetchCustomers,
  };
}
