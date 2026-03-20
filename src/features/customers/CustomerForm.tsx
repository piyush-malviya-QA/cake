"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Customer } from "@/types";

interface CustomerFormProps {
  customer: Customer | null;
  onSave: (data: { id?: string; name: string; phone: string; address: string }) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");

  function handleSave() {
    if (!name.trim() || !phone.trim()) return alert("Name and phone are required");
    onSave({ id: customer?.id, name: name.trim(), phone: phone.trim(), address: address.trim() });
  }

  return (
    <div>
      <Input label="Customer Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
      <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
      <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. MG Road, Nagpur" />
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>{customer ? "Update" : "Add Customer"}</Button>
      </div>
    </div>
  );
}
