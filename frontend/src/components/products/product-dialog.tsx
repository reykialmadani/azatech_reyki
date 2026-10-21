"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { FormField } from "@/components/shared/form-field";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { applyServerErrors, errorMessage } from "@/lib/api/form-errors";
import {
  productFormDefaults,
  productSchema,
  toProductPayload,
  type ProductFormValues,
} from "@/lib/schemas/product";
import type { Product } from "@/types/product";
import { ProductThumbnail } from "./product-thumbnail";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null; // null/undefined = mode tambah
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const isEdit = Boolean(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-lg p-0 shadow-none sm:max-w-md">
        <div className="space-y-1 border-b border-zinc-200 px-6 py-5">
          <DialogTitle className="text-lg font-medium tracking-tight text-zinc-900">
            {isEdit ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            {isEdit
              ? `Perbarui data produk ${product?.product_code}.`
              : "Lengkapi data produk baru untuk katalog."}
          </DialogDescription>
        </div>
        {/* Popup di-unmount saat tertutup, jadi form selalu mulai dari nilai segar. */}
        <ProductForm product={product ?? undefined} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productFormDefaults(product),
  });

  const imageUrl = useWatch({ control, name: "image_url" });

  const onSubmit = (values: ProductFormValues) => {
    const payload = toProductPayload(values);
    const callbacks = {
      onSuccess: () => {
        toast.success(
          product
            ? `Produk ${payload.product_code} berhasil diperbarui`
            : `Produk ${payload.product_code} berhasil ditambahkan`,
        );
        onDone();
      },
      onError: (error: unknown) => {
        const mapped = applyServerErrors(error, setError, Object.keys(values));
        if (!mapped) toast.error(errorMessage(error));
      },
    };

    if (product) updateMutation.mutate({ id: product.id, payload }, callbacks);
    else createMutation.mutate(payload, callbacks);
  };

  const describe = (field: keyof ProductFormValues) => ({
    id: field,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4 px-6 py-5">
        <FormField id="product_code" label="Kode Produk" error={errors.product_code?.message}>
          <Input
            {...describe("product_code")}
            placeholder="P0021"
            autoComplete="off"
            className="h-9 font-mono uppercase"
            {...register("product_code")}
          />
        </FormField>

        <FormField id="product_name" label="Nama Produk" error={errors.product_name?.message}>
          <Input
            {...describe("product_name")}
            placeholder="Hydrococo 150ml"
            className="h-9"
            {...register("product_name")}
          />
        </FormField>

        <FormField
          id="image_url"
          label="URL Gambar (Opsional)"
          error={errors.image_url?.message}
          hint="Gunakan URL gambar ringan (thumbnail). Boleh dikosongkan."
        >
          <div className="flex items-center gap-3">
            <Input
              {...describe("image_url")}
              type="url"
              inputMode="url"
              placeholder="https://…"
              className="h-9"
              {...register("image_url")}
            />
            <ProductThumbnail src={imageUrl?.trim()} alt="Pratinjau gambar produk" className="size-12" />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField id="price" label="Harga (Rp)" error={errors.price?.message}>
            <InputGroup className="h-9">
              <InputGroupAddon>
                <InputGroupText className="text-xs">Rp</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                {...describe("price")}
                type="number"
                inputMode="numeric"
                min={1}
                step="any"
                placeholder="12000"
                className="tabular-nums"
                {...register("price", { valueAsNumber: true })}
              />
            </InputGroup>
          </FormField>

          <FormField id="stock" label={product ? "Stok" : "Stok Awal"} error={errors.stock?.message}>
            <Input
              {...describe("stock")}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="h-9 tabular-nums"
              {...register("stock", { valueAsNumber: true })}
            />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end">
        <DialogClose render={<Button type="button" variant="outline" className="h-9 rounded-md" />}>
          Batal
        </DialogClose>
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md bg-black text-white hover:bg-zinc-800"
        >
          {isPending && <Loader2 className="animate-spin" />}
          Simpan Produk
        </Button>
      </div>
    </form>
  );
}
