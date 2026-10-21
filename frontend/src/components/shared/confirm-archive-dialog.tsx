"use client";

import type { ReactNode } from "react";
import { Archive, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
}

// Konfirmasi soft delete yang dipakai bersama oleh produk & pelanggan.
export function ConfirmArchiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, Arsipkan",
  isPending,
  onConfirm,
}: ConfirmArchiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-lg shadow-none">
        <AlertDialogHeader>
          <AlertDialogMedia className="border border-red-200 bg-red-50 text-red-600">
            <Archive />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
