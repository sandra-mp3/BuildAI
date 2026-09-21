"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { Avatar, AvatarFallback } from "@/components/ui/nav-primitives";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/lib/auth";

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [name, setName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);

  const initials = (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase();

  async function handleSave() {
    if (!user) return;
    if (isDemoMode) {
      toast.error("Profile changes aren't saved in Demo Mode.");
      return;
    }
    setSaving(true);
    try {
      if (isFirebaseConfigured && firebaseAuth?.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { displayName: name });
      }
      setUser({ ...user, displayName: name } as typeof user);
      toast.success("Profile updated");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Profile</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.displayName || "Unnamed"}</p>
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isDemoMode} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email ?? ""} disabled />
          </div>
          {isDemoMode && (
            <p className="rounded-md border border-seam/25 bg-seam/5 px-3 py-2 text-xs text-fg-muted">
              You&apos;re viewing the shared Demo Mode account — profile changes can&apos;t be saved.
            </p>
          )}
          <Button onClick={handleSave} disabled={saving || isDemoMode} className="w-full">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
