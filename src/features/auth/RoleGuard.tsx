"use client";

import { ReactNode } from "react";
import { useAuthContext } from "./AuthProvider";
import type { Role } from "@/types";

interface RoleGuardProps {
  allow: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  allow,
  children,
  fallback,
}: RoleGuardProps) {
  const { role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-slate-400">
        Loading...
      </div>
    );
  }

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!role || !allowed.includes(role)) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center p-10 text-slate-400">
          You do not have access to this page.
        </div>
      )
    );
  }

  return <>{children}</>;
}
