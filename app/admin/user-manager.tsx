"use client";

import { useAuth } from "@/lib/auth-context";
import { SectionHeader } from "@/app/components/ui/section-header";
import { Card } from "@/app/components/ui/card";
import { EmptyState } from "@/app/components/ui/empty-state";

export function UserManager() {
  const { allUsers, deleteUser } = useAuth();

  const regularUsers = allUsers.filter((u) => u.id !== "admin-001");

  return (
    <Card>
      <SectionHeader
        title="User Management"
        subtitle={`${regularUsers.length} registered users`}
      />

      {regularUsers.length === 0 ? (
        <EmptyState icon="👥" title="No users registered yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#faf8f3]">
                <th className="text-left p-3 font-semibold text-sm uppercase tracking-wider border-b border-[var(--line)]">Name</th>
                <th className="text-left p-3 font-semibold text-sm uppercase tracking-wider border-b border-[var(--line)]">Email</th>
                <th className="text-left p-3 font-semibold text-sm uppercase tracking-wider border-b border-[var(--line)]">Joined</th>
                <th className="text-left p-3 font-semibold text-sm uppercase tracking-wider border-b border-[var(--line)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="p-3 border-b border-[var(--line)]">
                    <strong>{user.name}</strong>
                  </td>
                  <td className="p-3 border-b border-[var(--line)]">{user.email}</td>
                  <td className="p-3 border-b border-[var(--line)]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td className="p-3 border-b border-[var(--line)]">
                    <button
                      onClick={() => {
                        if (confirm(`Delete user "${user.name}"?`)) {
                          deleteUser(user.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#ff6b6b] text-white rounded-md text-xs font-semibold cursor-pointer hover:bg-[#ff5252] transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

