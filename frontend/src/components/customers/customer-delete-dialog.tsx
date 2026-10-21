"use client";

import { toast } from "sonner";
import { ConfirmArchiveDialog } from "@/components/shared/confirm-archive-dialog";
import { useDeleteCustomer } from "@/hooks/use-customers";
import { errorMessage } from "@/lib/api/form-errors";
import type { Customer } from "@/types/customer";

interface CustomerDeleteDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDeleteDialog({ customer, open, onOpenChange }: CustomerDeleteDialogProps) {
  const deleteMutation = useDeleteCustomer();

  const onConfirm = () => {
    if (!customer) return;
    deleteMutation.mutate(customer.id, {
      onSuccess: () => {
        toast.success(`Pelanggan ${customer.customer_name} telah diarsipkan`);
        onOpenChange(false);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <ConfirmArchiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Arsipkan pelanggan ini?"
      isPending={deleteMutation.isPending}
      onConfirm={onConfirm}
      description={
        <>
          <span className="font-medium text-zinc-900">{customer?.customer_name}</span> tidak akan
          muncul lagi di daftar pelanggan maupun pilihan saat membuat pesanan. Riwayat pesanannya tetap utuh.
        </>
      }
    />
  );
}
