"use client";

import InventoryModule from "@/features/inventory/InventoryModule";
import RoleGuard from "@/features/auth/RoleGuard";

export default function InventoryPage() {
  return (
    <RoleGuard allow={["admin", "cashier"]}>
      <InventoryModule />
    </RoleGuard>
  );
}
