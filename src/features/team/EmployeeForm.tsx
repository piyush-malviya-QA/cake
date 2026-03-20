"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface EmployeeFormProps {
  onSave: (data: { name: string; email: string; password: string; role: string }) => void;
  onCancel: () => void;
}

export default function EmployeeForm({ onSave, onCancel }: EmployeeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  function handleSave() {
    if (!name.trim()) return alert("Name is required");
    if (!email.trim()) return alert("Email is required");
    if (!password || password.length < 6) return alert("Password must be at least 6 characters");
    onSave({ name: name.trim(), email: email.trim(), password, role });
  }

  return (
    <div>
      <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. priya@cakeifyy.com" />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { value: "cashier", label: "Cashier" },
          { value: "admin", label: "Admin" },
        ]}
      />
      <div className="flex gap-2.5 mt-2.5 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Add Employee</Button>
      </div>
    </div>
  );
}
