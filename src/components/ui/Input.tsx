"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm
          outline-none bg-slate-50 transition-colors duration-200
          focus:border-indigo-500 box-border
          ${className}
        `}
      />
    </div>
  );
}
