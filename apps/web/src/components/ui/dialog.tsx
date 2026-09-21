"use client";

/**
 * DIALOG.TSX — the pop-up window component used everywhere in BuildAI
 * (e.g. "Create a new project", "Rename project", "Enter Demo Mode").
 *
 * WHY THIS FILE EXISTS
 * ---------------------
 * Instead of writing a pop-up window from scratch every time I need one
 * (which would mean re-solving tricky problems like "how do I trap the
 * keyboard focus inside it" or "how do I close it when Escape is pressed"),
 * I use a library called Radix UI. Radix gives me the *behavior* of a
 * pop-up (open/close state, accessibility, focus trapping) but leaves the
 * *appearance* completely up to me. This file is where I style Radix's
 * behavior to look and feel like the rest of BuildAI.
 *
 * THE BUG I FIXED HERE
 * ---------------------
 * Earlier, the "New Project" pop-up would sometimes appear pinned to the
 * bottom-right corner of the screen instead of centered, which meant the
 * "Generate project" button could end up off-screen and unreachable.
 *
 * The cause: I was centering the pop-up using a common CSS trick called
 * "the transform-centering trick" — position it at the exact middle of the
 * screen (`left: 50%; top: 50%`) and then shift it back by half its own
 * width and height (`translate(-50%, -50%)`). This trick normally works,
 * but it has one well-known weakness: if ANY parent element on the page
 * has certain CSS properties (like a "transform"), the browser starts
 * measuring "the screen" from that parent's box instead of the real,
 * whole browser window. That's exactly what could happen here, since other
 * parts of the app (like the resizable project workspace) use those same
 * CSS properties for their own drag-and-drop panels.
 *
 * THE FIX: instead of the transform trick, I now make the invisible
 * backdrop cover the *entire* screen and use "flexbox centering"
 * (`display: flex; align-items: center; justify-content: center`) to place
 * the actual visible card in the middle of that backdrop. Flexbox
 * centering doesn't care what any parent element is doing — it always
 * centers its content within its own box. This is the same technique
 * professional design systems (like the ones Google and Vercel use) rely
 * on for exactly this reason: it simply cannot break the way the old
 * approach could.
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Root and Trigger are used exactly as Radix provides them — there's no
// styling to add, they're just the "is it open?" logic and the button that
// opens it.
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    // A "Portal" tells React: render everything inside me directly onto
    // the <body> of the page, not wherever this component happens to sit
    // in the app. This matters because a pop-up needs to visually sit on
    // top of *everything else*, and the easiest way to guarantee that is
    // to make sure nothing else can visually "contain" it.
    <DialogPrimitive.Portal>
      {/* The dimmed backdrop behind the pop-up. Clicking it closes the dialog
          (Radix wires that up automatically). */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />

      {/*
        This outer element is invisible on purpose — it's a full-screen
        flexbox "stage" whose only job is to center whatever is inside it.
        `pointer-events-none` means clicks pass straight through the empty
        space around the card to the backdrop underneath (so clicking
        outside the card still closes the dialog, exactly like before).
      */}
      <DialogPrimitive.Content
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        {...props}
      >
        {/*
          This inner div is the actual visible card people see and click
          inside. `pointer-events-auto` switches clicks back on just for
          this box, so buttons and text fields inside it work normally.

          `max-h-[90vh]` + `overflow-y-auto` means that even on a small
          phone screen, if the pop-up's content is taller than the screen,
          it becomes scrollable instead of being cut off — this is what
          fixes the earlier problem where the submit button could be
          pushed below the visible area with no way to reach it.
        */}
        <div
          className={cn(
            "pointer-events-auto relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-bg-panel p-6 shadow-2xl animate-fade-up",
            className
          )}
        >
          {children}
          <DialogPrimitive.Close className="forge-focus-ring absolute right-4 top-4 rounded-sm text-fg-subtle hover:text-fg">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative mb-4 space-y-1", className)} {...props} />;
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
