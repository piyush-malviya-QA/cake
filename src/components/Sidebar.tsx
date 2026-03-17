"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  FileText,
  Users,
  ClipboardList,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuthContext } from "@/features/auth/AuthProvider";
import SyncIndicator from "./SyncIndicator";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { id: "billing", label: "Billing / POS", href: "/billing", icon: <FileText size={20} /> },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: <Package size={20} /> },
  { id: "customers", label: "Customers", href: "/customers", icon: <Users size={20} /> },
  { id: "orders", label: "Order History", href: "/orders", icon: <ClipboardList size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userName, role, logout } = useAuthContext();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-[1100] bg-indigo-600 border-none rounded-lg w-10 h-10 flex md:hidden items-center justify-center cursor-pointer text-white"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-[1040] md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-[220px] bg-indigo-950 text-white flex flex-col
          fixed md:sticky top-0 h-screen z-[1050]
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-5 pt-5 pb-5 border-b border-white/10">
          <div className="text-[22px] font-extrabold">🎂 Sweet</div>
          <div className="text-xs text-indigo-300 mt-0.5">Delights Bakery</div>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className={`
                  flex items-center gap-2.5 w-full px-5 py-3 border-none text-sm text-left cursor-pointer
                  transition-all duration-150
                  ${active
                    ? "bg-indigo-500/30 text-white font-bold border-l-[3px] border-l-indigo-400"
                    : "bg-transparent text-indigo-200 font-medium border-l-[3px] border-l-transparent hover:bg-indigo-500/10"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info & sync */}
        <div className="px-5 py-3 border-t border-white/10">
          {userName && (
            <div className="text-xs text-indigo-300 mb-2">
              {userName} <span className="text-indigo-500">({role})</span>
            </div>
          )}
          <SyncIndicator status="synced" />
          <button
            onClick={logout}
            className="mt-3 text-xs text-indigo-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
