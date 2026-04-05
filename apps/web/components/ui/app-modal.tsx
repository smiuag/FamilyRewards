"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive modal: Sheet (bottom) on mobile, Dialog (center) on desktop.
 */
export function AppModal({ open, onOpenChange, children, className }: AppModalProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("sm:max-w-lg rounded-2xl p-0 overflow-hidden gap-0", className)}
          showCloseButton={false}
        >
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("rounded-t-3xl p-0 max-h-[92dvh] overflow-y-auto", className)}
        showCloseButton={false}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Colored header section for modals */
export function AppModalHeader({
  emoji,
  title,
  description,
  color = "bg-primary",
  onClose,
}: {
  emoji?: string;
  title: string;
  description?: string;
  color?: string;
  onClose?: () => void;
}) {
  return (
    <div className={cn("px-6 pt-6 pb-5 relative", color)}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <XIcon className="w-3.5 h-3.5 text-white" />
        </button>
      )}
      {emoji && <div className="text-4xl mb-3">{emoji}</div>}
      <h2 className="text-lg font-extrabold text-white leading-tight">{title}</h2>
      {description && (
        <p className="text-sm text-white/70 mt-0.5">{description}</p>
      )}
    </div>
  );
}

/** Body section */
export function AppModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-5 space-y-4", className)}>{children}</div>
  );
}

/** Footer with actions */
export function AppModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 pb-6 pt-2 flex items-center justify-end gap-2 border-t border-border",
        className
      )}
    >
      {children}
    </div>
  );
}
