"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlaskConical, CreditCard, LayoutGrid, LogOut, Settings, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PreferencesDialog } from "@/components/preferences-dialog";
import { ProfileDialog } from "@/components/profile-dialog";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/nav-primitives";
import { signOutUser, useAuthStore } from "@/lib/auth";

function BuildMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-violet" />
      <path d="M7 15.5 12 6l5 9.5" stroke="hsl(var(--violet-fg))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M9 12.5h6" stroke="hsl(var(--seam))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TopNav({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [profileOpen, setProfileOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const initials = (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase();

  async function handleSignOut() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BuildMark />
            <span className="text-sm font-semibold tracking-tight">BuildAI</span>
          </Link>
          {children}
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="hidden items-center gap-1.5 rounded-full border border-seam/30 bg-seam/10 px-2.5 py-1 text-[11px] font-medium text-seam sm:flex">
              <FlaskConical className="h-3 w-3" /> Demo Mode
            </span>
          )}
          <Link href="/dashboard" className="forge-focus-ring rounded-md p-2 text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg" title="Dashboard">
            <LayoutGrid className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="forge-focus-ring ml-1 rounded-full">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2.5 py-1.5 text-xs text-fg-subtle truncate max-w-[180px]">
                {user?.email}
              </div>
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon className="h-3.5 w-3.5" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPrefsOpen(true)}>
                <Settings className="h-3.5 w-3.5" /> Preferences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/billing")}>
                <CreditCard className="h-3.5 w-3.5" /> Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-error">
                <LogOut className="h-3.5 w-3.5" /> {isDemoMode ? "Exit demo" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isDemoMode && (
        <div className="flex items-center justify-center gap-2 border-b border-seam/25 bg-seam/10 px-4 py-1.5 text-center text-xs text-fg sm:hidden">
          <FlaskConical className="h-3 w-3 text-seam" />
          Demo Mode — nothing you build here is saved.
        </div>
      )}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
    </>
  );
}
