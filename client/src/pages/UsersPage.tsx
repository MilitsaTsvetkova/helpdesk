import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/UserForm";
import { UsersTable, type User } from "@/components/UsersTable";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; user: User }
  | null;

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<User[]>("/api/users", { withCredentials: true });
  return res.data;
}

export function UsersPage() {
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Users</h1>
        <Button onClick={() => setDialog({ mode: "create" })}>Create User</Button>
      </div>

      <UsersTable
        users={users}
        isPending={isPending}
        error={error}
        onEdit={(user) => setDialog({ mode: "edit", user })}
      />

      <Dialog open={dialog !== null} onOpenChange={(isOpen) => { if (!isOpen) setDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "edit" ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={dialog?.mode === "edit" ? dialog.user : undefined}
            onClose={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
