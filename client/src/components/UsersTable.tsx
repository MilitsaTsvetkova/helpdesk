import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Role } from "core";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type Props = {
  users: User[];
  isPending: boolean;
  error: Error | null;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
};

export function UsersTable({
  users,
  isPending,
  error,
  onEdit,
  onDelete,
}: Props) {
  if (isPending) {
    return (
      <div className="rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>;
  }

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-slate-500 py-8"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-slate-600">{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === Role.ADMIN
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete?.(user)}
                      disabled={user.role === Role.ADMIN}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 disabled:opacity-40"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
