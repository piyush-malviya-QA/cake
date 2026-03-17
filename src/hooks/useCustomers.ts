"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import type { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    if (!error && data) {
      setCustomers(data.map((d) => snakeToCamel<Customer>(d)));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function addCustomer(
    customer: Pick<Customer, "name" | "phone" | "address">
  ) {
    const newCustomer = {
      ...customer,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    const { error } = await supabase
      .from("customers")
      .insert(camelToSnake(newCustomer as unknown as Record<string, unknown>));
    if (!error) {
      setCustomers((prev) => [...prev, newCustomer as Customer]);
    }
    return !error;
  }

  async function updateCustomer(customer: Customer) {
    const updated = { ...customer, updatedAt: now() };
    const { error } = await supabase
      .from("customers")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", customer.id);
    if (!error) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? updated : c))
      );
    }
    return !error;
  }

  async function deleteCustomer(id: string) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
    return !error;
  }

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetch,
  };
}
