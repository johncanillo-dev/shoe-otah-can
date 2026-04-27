"use client";

import { useAuth } from "@/lib/auth-context";

export function UserManager() {
  const { allUsers, deleteUser } = useAuth();

  const regularUsers = allUsers.filter((u) => u.id !== "admin-001");

  return (
    <section className="admin-section">
      <div className="section-header">
        <h2>User Management ({regularUsers.length})</h2>
      </div>

      {regularUsers.length === 0 ? (
        <p className="empty-state">No users registered yet.</p>
      ) : (
        <div className="users-table" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>
                    <button
                      onClick={() => {
                        if (confirm(`Delete user "${user.name}"?`)) {
                          deleteUser(user.id);
                        }
                      }}
                      className="btn btn-delete"
                      style={{ fontSize: "0.8rem" }}
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

      <style>{`
        .users-table {
          margin-top: 1rem;
        }

        .users-table table {
          width: 100%;
          border-collapse: collapse;
          background: var(--surface);
        }

        .users-table th,
        .users-table td {
          border-bottom: 1px solid var(--line);
          padding: 0.75rem;
          text-align: left;
        }

        .users-table th {
          background: #faf8f3;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .users-table tr:hover {
          background: #faf8f3;
        }

        .users-table button {
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}
