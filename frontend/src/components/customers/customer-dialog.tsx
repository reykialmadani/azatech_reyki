"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { applyServerErrors, errorMessage } from "@/lib/api/form-errors";
import {
  customerFormDefaults,
  customerSchema,
  toCustomerPayload,
  type CustomerFormValues,
} from "@/lib/schemas/customer";
import { cn } from "@/lib/utils";
import { GENDERS, type Customer } from "@/types/customer";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null; // null/undefined = mode tambah
}

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const isEdit = Boolean(customer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-lg p-0 shadow-none sm:max-w-md">
        <div className="space-y-1 border-b border-zinc-200 px-6 py-5">
          <DialogTitle className="text-lg font-medium tracking-tight text-zinc-900">
            {isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            {isEdit ? "Perbarui data pelanggan." : "Lengkapi data pelanggan baru."}
          </DialogDescription>
        </div>
        <CustomerForm customer={customer ?? undefined} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customer, onDone }: { customer?: Customer; onDone: () => void }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customerFormDefaults(customer),
  });

  const onSubmit = (values: CustomerFormValues) => {
    const payload = toCustomerPayload(values);
    const callbacks = {
      onSuccess: () => {
        toast.success(
          customer
            ? `Data ${payload.customer_name} berhasil diperbarui`
            : `Pelanggan ${payload.customer_name} berhasil ditambahkan`,
        );
        onDone();
      },
      onError: (error: unknown) => {
        const mapped = applyServerErrors(error, setError, Object.keys(values));
        if (!mapped) toast.error(errorMessage(error));
      },
    };

    if (customer) updateMutation.mutate({ id: customer.id, payload }, callbacks);
    else createMutation.mutate(payload, callbacks);
  };

  const describe = (field: keyof CustomerFormValues) => ({
    id: field,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-4 px-6 py-5">
        <FormField id="customer_name" label="Nama Pelanggan" error={errors.customer_name?.message}>
          <Input
            {...describe("customer_name")}
            placeholder="Budi Santoso"
            autoComplete="off"
            className="h-9"
            {...register("customer_name")}
          />
        </FormField>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="micro-label mb-1.5">Jenis Kelamin</legend>
          <div
            role="radiogroup"
            aria-invalid={Boolean(errors.gender)}
            aria-describedby={errors.gender ? "gender-error" : undefined}
            className={cn(
              "grid grid-cols-2 gap-2",
              errors.gender && "rounded-lg ring-3 ring-red-600/20",
            )}
          >
            {GENDERS.map((gender) => (
              <label
                key={gender}
                className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-zinc-200 text-sm text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 has-checked:border-black has-checked:bg-black has-checked:text-white has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input
                  type="radio"
                  value={gender}
                  className="sr-only"
                  {...register("gender")}
                />
                {gender}
              </label>
            ))}
          </div>
          {errors.gender && (
            <p id="gender-error" role="alert" className="text-xs text-red-600">
              {errors.gender.message}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="birth_date" label="Tanggal Lahir" error={errors.birth_date?.message}>
            <Input
              {...describe("birth_date")}
              type="date"
              max={format(new Date(), "yyyy-MM-dd")}
              className="h-9 tabular-nums"
              {...register("birth_date")}
            />
          </FormField>

          <FormField id="phone" label="No. HP (Opsional)" error={errors.phone?.message}>
            <Input
              {...describe("phone")}
              type="tel"
              inputMode="tel"
              placeholder="081234567890"
              className="h-9 font-mono"
              {...register("phone")}
            />
          </FormField>
        </div>

        <FormField id="customer_address" label="Alamat" error={errors.customer_address?.message}>
          <Textarea
            {...describe("customer_address")}
            rows={3}
            placeholder="Jl. Sudirman No. 1, Jakarta"
            className="min-h-20 resize-none"
            {...register("customer_address")}
          />
        </FormField>
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
          Simpan Pelanggan
        </Button>
      </div>
    </form>
  );
}
