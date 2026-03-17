"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl w-full max-h-[90vh] overflow-auto shadow-2xl ${
          wide ? "max-w-[600px]" : "max-w-[440px]"
        }`}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
          <h3 className="m-0 text-[17px] font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-slate-400 p-1 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
