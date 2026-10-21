"use client";

import { useState, type ReactNode } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MapPin, Phone } from "lucide-react";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { useCreateOrder } from "@/hooks/use-orders";
import { applyServerErrors, errorMessage } from "@/lib/api/form-errors";
import {
  findStockIssues,
  orderSchema,
  toOrderPayload,
  type OrderFormValues,
} from "@/lib/schemas/order";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import { CustomerCombobox } from "./customer-combobox";
import { OrderItemRow } from "./order-item-row";
import { OrderSummaryCard } from "./order-summary-card";
import { ProductPicker } from "./product-picker";

export function OrderForm() {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customer_id: "", items: [] },
  });
  const { control, getValues, setValue, setError, clearErrors, handleSubmit, formState } = form;
  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  // Snapshot data untuk tampilan (nama, harga, stok). Tidak ikut dikirim ke server.
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [serverAlert, setServerAlert] = useState<string | null>(null);

  const createOrder = useCreateOrder();
  const isSubmitting = createOrder.isPending || createOrder.isSuccess;

  const selectCustomer = (selected: Customer) => {
    setCustomer(selected);
    setValue("customer_id", selected.id, { shouldValidate: formState.isSubmitted });
  };

  const quantityInCart = (productId: number) =>
    watchedItems.find((item) => item.product_id === productId)?.quantity ?? 0;

  const addProduct = (product: Product) => {
    setProducts((prev) => ({ ...prev, [product.id]: product }));
    const items = getValues("items");
    const index = items.findIndex((item) => item.product_id === product.id);

    if (index >= 0) {
      // Produk yang sama tidak dibuat baris baru, cukup tambah jumlahnya (maksimal sebesar stok).
      const current = items[index]!.quantity;
      const next = (Number.isFinite(current) ? current : 0) + 1;
      if (next > product.stock) return;
      setValue(`items.${index}.quantity`, next, {
        shouldValidate: formState.isSubmitted,
      });
    } else {
      if (product.stock <= 0) return;
      append({ product_id: product.id, quantity: 1 }, { shouldFocus: false });
      clearErrors("items");
    }
  };

  const clearCart = () => {
    replace([]);
    setServerAlert(null);
  };

  const onSubmit = (values: OrderFormValues) => {
    setServerAlert(null);

    const stockIssues = findStockIssues(values.items, products);
    if (stockIssues.length > 0) {
      stockIssues.forEach(({ index, message }) =>
        setError(`items.${index}.quantity`, { type: "stock", message }),
      );
      setServerAlert("Jumlah beberapa produk melebihi stok tersedia");
      return;
    }

    createOrder.mutate(toOrderPayload(values), {
      onError: (error) => {
        // Mis. { "items.0.quantity": ["Stok Hydrococo tersisa 1, diminta 2"] }
        // dipetakan langsung ke baris item terkait.
        applyServerErrors(error, setError, ["customer_id", "items"]);
        setServerAlert(errorMessage(error));
      },
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5"
      >
        <div className="flex flex-col gap-6 lg:col-span-3">
          {serverAlert && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Transaksi gagal diproses</p>
                <p className="text-red-600">
                  {serverAlert}. Periksa baris yang ditandai merah lalu coba lagi. Tidak ada stok yang berkurang.
                </p>
              </div>
            </div>
          )}

          <Step number={1} title="Pilih Pelanggan">
            <div className="flex flex-col gap-1.5">
              <CustomerCombobox
                id="customer_id"
                value={customer}
                onSelect={selectCustomer}
                invalid={Boolean(formState.errors.customer_id)}
              />
              {formState.errors.customer_id && (
                <p role="alert" className="text-xs text-red-600">
                  {formState.errors.customer_id.message}
                </p>
              )}
            </div>

            {customer && (
              <div className="mt-3 flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <CustomerAvatar name={customer.customer_name} className="bg-white" />
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="font-medium text-zinc-900">
                    {customer.customer_name}
                    <span className="ml-2 text-xs font-normal text-zinc-500">{customer.gender}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Phone className="size-3" />
                    <span className="font-mono">{customer.phone ?? "-"}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="size-3" />
                    <span className="truncate">{customer.customer_address}</span>
                  </p>
                </div>
              </div>
            )}
          </Step>

          <Step number={2} title="Tambah Produk ke Pesanan" description="Klik produk untuk menambahkannya. Klik lagi untuk menambah jumlah.">
            <ProductPicker onAdd={addProduct} quantityInCart={quantityInCart} />
          </Step>
        </div>

        <div className="lg:col-span-2">
          <OrderSummaryCard products={products} isSubmitting={isSubmitting} onClear={clearCart}>
            {fields.map((field, index) => (
              <OrderItemRow
                key={field.id}
                index={index}
                product={products[field.product_id]}
                onRemove={() => remove(index)}
              />
            ))}
          </OrderSummaryCard>
        </div>
      </form>
    </FormProvider>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
          {number}
        </span>
        <div>
          <h2 className="micro-label pt-1 text-zinc-900">{title}</h2>
          {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
