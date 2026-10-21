"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import AdminNav from "@/components/AdminNav";

interface UserRow {
  id: string;
  role: string;
  name: string;
  email?: string;
  mobile: string;
  shopId?: string;
  village?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    api<{ users: UserRow[] }>("/api/admin/users").then((r) => setUsers(r.users)).catch(() => {});
  }, []);

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">Users</h2>
      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-leaf-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Email</th>
              <th className="p-3">Village / Shop</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.mobile}</td>
                <td className="p-3">{u.email ?? "—"}</td>
                <td className="p-3">{u.village ?? u.shopId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
