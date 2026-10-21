"use client";

import { toast } from "sonner";
import { ConfirmArchiveDialog } from "@/components/shared/confirm-archive-dialog";
import { useDeleteProduct } from "@/hooks/use-products";
import { errorMessage } from "@/lib/api/form-errors";
import type { Product } from "@/types/product";

interface ProductDeleteDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDeleteDialog({ product, open, onOpenChange }: ProductDeleteDialogProps) {
  const deleteMutation = useDeleteProduct();

  const onConfirm = () => {
    if (!product) return;
    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        toast.success(`Produk ${product.product_code} telah diarsipkan`);
        onOpenChange(false);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <ConfirmArchiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Arsipkan produk ini?"
      isPending={deleteMutation.isPending}
      onConfirm={onConfirm}
      description={
        <>
          <span className="font-medium text-zinc-900">
            {product?.product_name} ({product?.product_code})
          </span>{" "}
          akan disembunyikan dari katalog. Riwayat transaksi yang memakai produk ini tetap utuh.
        </>
      }
    />
  );
}
