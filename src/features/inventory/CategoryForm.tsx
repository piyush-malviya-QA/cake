"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Category } from "@/types";

const EMOJI_OPTIONS = [
  "🎂", "🧁", "🍰", "🍪", "🍩", "🍮", "🍯", "🍫",
  "🍨", "🍦", "🥧", "🍬", "🍭", "🍰", "🍩", "🥐",
  "🥖", "🥯", "🍞", "🥪", "🌯", "🌮", "🍕", "🥗",
];

interface CategoryFormProps {
  category: Category | null;
  onSave: (data: { id?: string; name: string; icon: string }) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [icon, setIcon] = useState(category?.icon || "🎂");

  useEffect(() => {
    setName(category?.name || "");
    setIcon(category?.icon || "🎂");
  }, [category]);

  function handleSave() {
    if (!name.trim()) return alert("Category name is required");
    onSave({
      id: category?.id,
      name: name.trim(),
      icon,
    });
  }

  return (
    <div>
      <Input
        label="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Cakes, Pastries, Cookies"
      />
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
          ICON
        </label>
        <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-lg bg-slate-50 max-h-[120px] overflow-y-auto">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-9 h-9 text-lg rounded-md flex items-center justify-center transition-colors ${
                icon === emoji
                  ? "bg-indigo-100 border-2 border-indigo-500"
                  : "bg-white border border-slate-200 hover:border-indigo-300"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Preview: <span className="text-lg">{icon}</span> {name || "Category Name"}
        </div>
      </div>
      <div className="flex gap-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>
          {category ? "Update" : "Add Category"}
        </Button>
      </div>
    </div>
  );
}
