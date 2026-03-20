"use client";

import { useState } from "react";
import { Plus, Trash2, Shield, ShoppingCart, Store, Pencil, History } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/SearchBar";
import EmployeeForm from "./EmployeeForm";
import ShopSettingsForm from "./ShopSettingsForm";
import ActivityLog from "./ActivityLog";
import RoleGuard from "@/features/auth/RoleGuard";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/features/auth/AuthProvider";

export default function TeamModule() {
  const { employees, loading, addEmployee, deleteEmployee } = useEmployees();
  const { userId, shopName, shopAddress, shopPhone } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data: { name: string; email: string; password: string; role: string }) {
    setSaving(true);
    const result = await addEmployee(data);
    setSaving(false);
    if (result.success) {
      setShowForm(false);
    } else {
      alert(result.error || "Failed to add employee");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete employee "${name}"? They will no longer be able to log in.`)) return;
    const result = await deleteEmployee(id);
    if (!result.success) {
      alert(result.error || "Failed to delete employee");
    }
  }

  return (
    <RoleGuard allow="admin">
      <div>
        {/* Shop Info Card */}
        <div className="bg-white rounded-[10px] border border-slate-200 p-4 mb-5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Store size={20} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-800">{shopName || "Your Shop"}</div>
                <div className="text-[13px] text-slate-500 mt-0.5">
                  {[shopAddress, shopPhone].filter(Boolean).join(" • ") || "No address or phone set"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowShopSettings(true)}
              className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-indigo-600 p-1 transition-colors"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search team members..." />
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add Employee
          </Button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading team...</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {filtered.map((e) => (
              <div key={e.id} className="bg-white rounded-[10px] border border-slate-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[15px] font-bold text-slate-800 flex items-center gap-1.5">
                      {e.name}
                      {e.id === userId && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">YOU</span>
                      )}
                    </div>
                    <div className="text-[13px] text-slate-500 mt-0.5">{e.email}</div>
                  </div>
                  {e.id !== userId && (
                    <button
                      onClick={() => handleDelete(e.id, e.name)}
                      className="bg-transparent border-none cursor-pointer text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      e.role === "admin"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {e.role === "admin" ? <Shield size={12} /> : <ShoppingCart size={12} />}
                    {e.role === "admin" ? "Admin" : "Cashier"}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="col-span-full p-10 text-center text-slate-400">
                No team members found
              </div>
            )}
          </div>
        )}

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Add Employee"
        >
          <EmployeeForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
          {saving && (
            <div className="text-center text-sm text-slate-400 mt-2">Creating account...</div>
          )}
        </Modal>

        {/* Activity Log */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <History size={18} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Activity Log</h2>
          </div>
          <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden">
            <ActivityLog />
          </div>
        </div>

        <Modal
          open={showShopSettings}
          onClose={() => setShowShopSettings(false)}
          title="Shop Settings"
        >
          <ShopSettingsForm
            initialName={shopName || ""}
            initialAddress={shopAddress || ""}
            initialPhone={shopPhone || ""}
            onClose={() => setShowShopSettings(false)}
          />
        </Modal>
      </div>
    </RoleGuard>
  );
}
