"use client";

import RoleGuard from "@/features/auth/RoleGuard";
import InsightsModule from "@/features/insights/InsightsModule";

export default function InsightsPage() {
  return (
    <RoleGuard allow="admin">
      <InsightsModule />
    </RoleGuard>
  );
}
