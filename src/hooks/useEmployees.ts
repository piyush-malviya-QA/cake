"use client";

import { useState, useEffect, useCallback } from "react";
import type { Employee } from "@/types";

function snakeToCamel(obj: Record<string, unknown>): Employee {
  return {
    id: obj.id as string,
    name: obj.name as string,
    email: obj.email as string,
    role: obj.role as Employee["role"],
    shopId: obj.shop_id as string,
    createdAt: obj.created_at as string,
  };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/employees");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.map((d: Record<string, unknown>) => snakeToCamel(d)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  async function addEmployee(input: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    await fetchEmployees();
    return { success: true };
  }

  async function deleteEmployee(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    return { success: true };
  }

  return { employees, loading, addEmployee, deleteEmployee, refetch: fetchEmployees };
}
