"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/features/auth/AuthProvider";
import Sidebar from "@/components/Sidebar";

const pageLabels: Record<string, string> = {
  "/billing": "Billing / POS",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/orders": "Order History",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1 p-5 md:px-6 overflow-auto max-w-[1200px] mx-auto w-full">
          <div className="mb-5 pl-12 md:pl-0">
            <h1 className="m-0 text-[22px] font-extrabold text-slate-800">
              {pageLabels[pathname] || "Dashboard"}
            </h1>
            <p className="mt-1 text-[13px] text-slate-400">{today}</p>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
