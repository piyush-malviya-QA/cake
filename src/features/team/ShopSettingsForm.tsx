"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ShopSettingsFormProps {
  initialName: string;
  initialAddress: string;
  initialPhone: string;
  onClose: () => void;
}

export default function ShopSettingsForm({
  initialName,
  initialAddress,
  initialPhone,
  onClose,
}: ShopSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return alert("Shop name is required");
    setSaving(true);
    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), address: address.trim(), phone: phone.trim() }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update shop");
      return;
    }

    // Reload to refresh AuthProvider context with new shop info
    window.location.reload();
  }

  return (
    <div>
      <Input
        label="Shop Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. The Cakeifyy"
      />
      <Input
        label="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g. 123 Main St, City"
      />
      <Input
        label="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="e.g. +91-9876543210"
      />
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
