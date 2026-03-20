"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onSave: (data: {
    id?: string;
    name: string;
    catId: string;
    buyPrice: number;
    sellPrice: number;
    qty: number;
  }) => void;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [catId, setCatId] = useState(product?.catId || categories[0]?.id || "");
  const [buyPrice, setBuyPrice] = useState(product?.buyPrice?.toString() || "");
  const [sellPrice, setSellPrice] = useState(product?.sellPrice?.toString() || "");
  const [qty, setQty] = useState(product?.qty?.toString() || "");

  function handleSave() {
    if (!name.trim()) return alert("Product name is required");
    onSave({
      id: product?.id,
      name: name.trim(),
      catId,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      qty: Number(qty),
    });
  }

  return (
    <div>
      <Input
        label="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Black Forest Cake (1kg)"
      />
      <Select
        label="Category"
        value={catId}
        onChange={(e) => setCatId(e.target.value)}
        options={categories.map((c) => ({
          value: c.id,
          label: `${c.icon} ${c.name}`,
        }))}
      />
      <div className="grid grid-cols-3 gap-2.5">
        <Input
          label="Buy Price (₹)"
          type="number"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          placeholder="0"
        />
        <Input
          label="Sell Price (₹)"
          type="number"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="0"
        />
        <Input
          label="Quantity"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
        />
      </div>
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>
          {product ? "Update" : "Add Product"}
        </Button>
      </div>
    </div>
  );
}
