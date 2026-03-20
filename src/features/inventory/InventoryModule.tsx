"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import SearchBar from "@/components/SearchBar";
import ProductForm from "./ProductForm";
import CategoryForm from "./CategoryForm";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { fmt } from "@/lib/utils";
import type { Product, Category } from "@/types";

export default function InventoryModule() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { role } = useAuthContext();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const filtered = products.filter(
    (p) =>
      (filterCat === "all" || p.catId === filterCat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalInvestment = filtered.reduce((s, p) => s + p.buyPrice * p.qty, 0);
  const totalValue = filtered.reduce((s, p) => s + p.sellPrice * p.qty, 0);
  const totalProfit = totalValue - totalInvestment;

  async function handleSaveProduct(data: {
    id?: string;
    name: string;
    catId: string;
    buyPrice: number;
    sellPrice: number;
    qty: number;
  }) {
    if (data.id) {
      const existing = products.find((p) => p.id === data.id)!;
      await updateProduct({ ...existing, ...data });
    } else {
      await addProduct(data);
    }
    setShowProductForm(false);
    setEditProduct(null);
  }

  async function handleDeleteProduct(id: string) {
    if (confirm("Delete this product?")) {
      await deleteProduct(id);
    }
  }

  async function handleSaveCategory(data: { id?: string; name: string; icon: string }) {
    if (data.id) {
      const existing = categories.find((c) => c.id === data.id)!;
      await updateCategory({ ...existing, ...data });
    } else {
      await addCategory({ id: data.id || "", ...data });
    }
    setShowCategoryForm(false);
    setEditCategory(null);
  }

  async function handleDeleteCategory(id: string) {
    const productsInCategory = products.filter((p) => p.catId === id);
    if (productsInCategory.length > 0) {
      alert(`Cannot delete category with ${productsInCategory.length} products. Please reassign or delete products first.`);
      return;
    }
    if (confirm("Delete this category?")) {
      await deleteCategory(id);
      if (filterCat === id) setFilterCat("all");
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-5">
        <StatCard label="Total Items" value={filtered.length} color="#6366f1" />
        <StatCard label="Investment" value={fmt(totalInvestment)} color="#f59e0b" />
        <StatCard label="Sale Value" value={fmt(totalValue)} color="#3b82f6" />
        <StatCard
          label="Potential Profit"
          value={fmt(totalProfit)}
          color={totalProfit >= 0 ? "#059669" : "#dc2626"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2.5 border-[1.5px] border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <>
            <Button variant="ghost" onClick={() => { setEditCategory(null); setShowCategoryForm(true); }}>
              <FolderOpen size={18} /> Manage Categories
            </Button>
            <Button onClick={() => { setEditProduct(null); setShowProductForm(true); }}>
              <Plus size={18} /> Add Product
            </Button>
          </>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[10px] border border-slate-200 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              {["Product", "Category", "Buy Price", "Sell Price", "Qty", "Profit/Unit", "Total Profit", ...(isAdmin ? ["Actions"] : [])].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3.5 py-2.5 text-left font-bold text-slate-500 text-[11px] uppercase tracking-wide border-b border-slate-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.catId);
              const profitUnit = p.sellPrice - p.buyPrice;
              const totalP = profitUnit * p.qty;
              return (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-3.5 py-2.5 font-semibold text-slate-800">{p.name}</td>
                  <td className="px-3.5 py-2.5 text-slate-500">
                    {cat ? `${cat.icon} ${cat.name}` : "—"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500">{fmt(p.buyPrice)}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-semibold">{fmt(p.sellPrice)}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        p.qty <= 5
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {p.qty}
                    </span>
                  </td>
                  <td
                    className={`px-3.5 py-2.5 font-semibold ${
                      profitUnit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt(profitUnit)}
                  </td>
                  <td
                    className={`px-3.5 py-2.5 font-bold ${
                      totalP >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmt(totalP)}
                  </td>
                  {isAdmin && (
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => { setEditProduct(p); setShowProductForm(true); }}
                        className="bg-transparent border-none cursor-pointer text-indigo-500 p-1 mr-1"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-transparent border-none cursor-pointer text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  className="p-10 text-center text-slate-400"
                >
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        open={showProductForm}
        onClose={() => { setShowProductForm(false); setEditProduct(null); }}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          product={editProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={() => { setShowProductForm(false); setEditProduct(null); }}
        />
      </Modal>

      {/* Manage Categories Modal */}
      <Modal
        open={showCategoryForm}
        onClose={() => { setShowCategoryForm(false); setEditCategory(null); }}
        title="Manage Categories"
      >
        <div className="space-y-3">
          {/* Category List */}
          <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-lg">
            {categories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No categories yet. Add one below.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-xs text-slate-400">
                      ({products.filter((p) => p.catId === cat.id).length} items)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditCategory(cat); setShowCategoryForm(true); }}
                      className="bg-transparent border-none cursor-pointer text-indigo-500 p-1 hover:bg-indigo-50 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="bg-transparent border-none cursor-pointer text-red-600 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add/Edit Category Form */}
          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">
              {editCategory ? "Edit Category" : "Add New Category"}
            </h4>
            <CategoryForm
              category={editCategory}
              onSave={handleSaveCategory}
              onCancel={() => { setShowCategoryForm(false); setEditCategory(null); }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
