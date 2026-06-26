import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserForm } from "@/components/UserForm";
import { UsersTable, type User } from "@/components/UsersTable";

type DialogState = { mode: "create" } | { mode: "edit"; user: User } | null;

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<User[]>("/api/users", { withCredentials: true });
  return res.data;
}

export function UsersPage() {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      axios.delete(`/api/users/${userId}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserToDelete(null);
    },
  });

  const deleteErrorMessage = deleteMutation.error
    ? axios.isAxiosError(deleteMutation.error) && deleteMutation.error.response?.data?.error
      ? deleteMutation.error.response.data.error
      : "Something went wrong. Please try again."
    : null;

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
        onDelete={setUserToDelete}
      />

      {/* Create / Edit dialog */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(isOpen) => { if (!isOpen) setDialog(null); }}
      >
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

      {/* Delete confirmation */}
      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            deleteMutation.reset();
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteErrorMessage && (
            <p className="text-sm text-red-600 -mt-2">{deleteErrorMessage}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(userToDelete!.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
