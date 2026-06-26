import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "@/components/CreateUserForm";
import { UsersTable, type User } from "@/components/UsersTable";

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<User[]>("/api/users", { withCredentials: true });
  return res.data;
}

export function UsersPage() {
  const [open, setOpen] = useState(false);

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Users</h1>
        <Button onClick={() => setOpen(true)}>Create User</Button>
      </div>

      <UsersTable users={users} isPending={isPending} error={error} />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">Create User</h2>
            <CreateUserForm onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
