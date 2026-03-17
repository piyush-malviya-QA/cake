"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <Search size={18} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-3 pl-9 border-[1.5px] border-slate-200 rounded-lg text-sm outline-none bg-white box-border focus:border-indigo-500"
      />
    </div>
  );
}
