"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "success" | "danger" | "ghost" | "whatsapp";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white border-transparent hover:bg-indigo-700",
  success: "bg-emerald-600 text-white border-transparent hover:bg-emerald-700",
  danger: "bg-red-600 text-white border-transparent hover:bg-red-700",
  ghost: "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50",
  whatsapp: "bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]",
};

export default function Button({
  children,
  variant = "primary",
  small = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 rounded-lg border font-semibold
        cursor-pointer transition-all duration-150
        ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}
        ${variantStyles[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
