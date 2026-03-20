"use client";

import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 mb-3.5 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={`px-4 py-2 rounded-full cursor-pointer text-[13px] font-semibold transition-all ${
          active === "all"
            ? "bg-indigo-600 text-white border-2 border-indigo-600 shadow-sm"
            : "bg-white text-slate-500 border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`px-4 py-2 rounded-full cursor-pointer text-[13px] font-semibold transition-all ${
            active === c.id
              ? "bg-indigo-600 text-white border-2 border-indigo-600 shadow-sm"
              : "bg-white text-slate-500 border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {c.icon} {c.name}
        </button>
      ))}
    </div>
  );
}
