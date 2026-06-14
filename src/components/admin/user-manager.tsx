"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteUser, useUsers } from "@/hooks/useAdmin";
import type { UserProfile } from "@/types";

export function UserManager() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Permanently remove a user. This deletes their profile, all of their
          predictions, and their sign-in account. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : !users || users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No users yet.
          </p>
        ) : (
          users.map((user) => (
            <UserRow
              key={user.uid}
              user={user}
              isSelf={user.uid === currentUser?.uid}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({ user, isSelf }: { user: UserProfile; isSelf: boolean }) {
  const remove = useDeleteUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function confirmDelete() {
    try {
      const { predictionsDeleted } = await remove.mutateAsync({
        uid: user.uid,
      });
      toast.success("User removed", {
        description: `${user.displayName} and ${predictionsDeleted} prediction(s) deleted.`,
      });
      setConfirmOpen(false);
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-9 w-9">
        {user.photoURL && (
          <AvatarImage src={user.photoURL} alt={user.displayName} />
        )}
        <AvatarFallback>
          {user.displayName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={isSelf || remove.isPending}
        title={isSelf ? "You cannot remove your own account." : "Remove user"}
        aria-label={`Remove ${user.displayName}`}
      >
        {remove.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {user.displayName}?</DialogTitle>
            <DialogDescription>
              This permanently deletes their profile, all of their predictions,
              and their sign-in account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
