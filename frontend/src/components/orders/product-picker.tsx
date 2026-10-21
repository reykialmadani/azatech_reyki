"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { StockBadge } from "@/components/products/stock-badge";
import { useDebounce } from "@/hooks/use-debounce";
import { useProducts } from "@/hooks/use-products";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductPickerProps {
  onAdd: (product: Product) => void;
  quantityInCart: (productId: number) => number;
}

export function ProductPicker({ onAdd, quantityInCart }: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data, isPending, isFetching } = useProducts({
    search: debouncedSearch,
    per_page: 8,
    sort: "product_name:asc",
  });
  const products = data?.data ?? [];

  return (
    <Command shouldFilter={false} className="rounded-md! border border-zinc-200 bg-white p-0">
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Cari nama atau kode produk…"
        aria-label="Cari produk"
      />
      <CommandList className="max-h-80 p-1">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Memuat produk…
          </div>
        ) : (
          <>
            <CommandEmpty className="py-8 text-zinc-500">Produk tidak ditemukan.</CommandEmpty>
            <CommandGroup className={cn("p-0", isFetching && "opacity-60")}>
              {products.map((product) => {
                const inCart = quantityInCart(product.id);
                const soldOut = product.stock <= 0;
                const maxedOut = !soldOut && inCart >= product.stock;
                return (
                  <CommandItem
                    key={product.id}
                    value={String(product.id)}
                    disabled={soldOut || maxedOut}
                    onSelect={() => onAdd(product)}
                    className="gap-3 rounded-md px-2 py-2 [&>svg:last-child]:hidden"
                  >
                    <ProductThumbnail src={product.image_url} alt={product.product_name} className="size-9" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-zinc-900">{product.product_name}</span>
                      <span className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono">{product.product_code}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">{formatRupiah(product.price)}</span>
                        {inCart > 0 && (
                          <span className="font-medium text-zinc-900">· {inCart} di pesanan</span>
                        )}
                        {maxedOut && <span className="text-amber-600">· batas stok</span>}
                      </span>
                    </div>
                    <StockBadge stock={product.stock} className="hidden sm:inline-flex" />
                    {!soldOut && !maxedOut && (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 group-data-selected/command-item:border-black group-data-selected/command-item:bg-black group-data-selected/command-item:text-white">
                        <Plus className="size-3.5" />
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
