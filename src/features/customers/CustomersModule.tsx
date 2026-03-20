"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/SearchBar";
import CustomerForm from "./CustomerForm";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { fmt } from "@/lib/utils";
import type { Customer } from "@/types";

export default function CustomersModule() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { orders } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  async function handleSave(data: { id?: string; name: string; phone: string; address: string }) {
    if (data.id) {
      const existing = customers.find((c) => c.id === data.id)!;
      await updateCustomer({ ...existing, ...data });
    } else {
      await addCustomer(data);
    }
    setShowForm(false);
    setEditCust(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this customer?")) {
      await deleteCustomer(id);
    }
  }

  return (
    <div>
      <div className="flex gap-2.5 mb-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
        <Button onClick={() => { setEditCust(null); setShowForm(true); }}>
          <Plus size={18} /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {filtered.map((c) => {
          const custOrders = orders.filter((o) => o.customerId === c.id);
          const totalSpent = custOrders.reduce((s, o) => s + o.total, 0);
          return (
            <div key={c.id} className="bg-white rounded-[10px] border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[15px] font-bold text-slate-800">{c.name}</div>
                  <div className="text-[13px] text-slate-500 mt-0.5">📞 {c.phone}</div>
                  {c.address && (
                    <div className="text-xs text-slate-400 mt-0.5">📍 {c.address}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditCust(c); setShowForm(true); }}
                    className="bg-transparent border-none cursor-pointer text-indigo-500 p-1"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="bg-transparent border-none cursor-pointer text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">ORDERS</div>
                  <div className="text-base font-extrabold text-indigo-600">{custOrders.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">TOTAL SPENT</div>
                  <div className="text-base font-extrabold text-emerald-600">{fmt(totalSpent)}</div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-400">
            No customers found
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditCust(null); }}
        title={editCust ? "Edit Customer" : "Add Customer"}
      >
        <CustomerForm
          customer={editCust}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditCust(null); }}
        />
      </Modal>
    </div>
  );
}
