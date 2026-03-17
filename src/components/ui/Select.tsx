"use client";

import { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
}

export default function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm
          outline-none bg-slate-50 box-border
          ${className}
        `}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
