"use client";

import { useState } from "react";
import { PackageSearch, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeletonRows } from "@/components/shared/table-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useProducts } from "@/hooks/use-products";
import { errorMessage } from "@/lib/api/form-errors";
import { formatRupiah } from "@/lib/format";
import type { Product, ProductSort } from "@/types/product";
import { ProductDeleteDialog } from "./product-delete-dialog";
import { ProductDialog } from "./product-dialog";
import { ProductThumbnail } from "./product-thumbnail";
import { StockBadge } from "./stock-badge";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "product_name:asc", label: "Nama (A–Z)" },
  { value: "product_name:desc", label: "Nama (Z–A)" },
  { value: "price:asc", label: "Harga Termurah" },
  { value: "price:desc", label: "Harga Termahal" },
  { value: "stock:asc", label: "Stok Paling Sedikit" },
  { value: "stock:desc", label: "Stok Paling Banyak" },
];

const PER_PAGE = 10;
const COLUMNS = 6;

export function ProductsView() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ProductSort>("product_name:asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Dipertahankan saat dialog menutup agar konten tidak berkedip selama animasi keluar.
  const [selected, setSelected] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useProducts({
    page,
    per_page: PER_PAGE,
    search: debouncedSearch,
    sort,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  // Mis. setelah menghapus satu-satunya produk di halaman terakhir.
  if (meta && !isPlaceholderData && page > meta.total_pages) {
    setPage(meta.total_pages);
  }

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };
  const openEdit = (product: Product) => {
    setSelected(product);
    setFormOpen(true);
  };
  const openDelete = (product: Product) => {
    setSelected(product);
    setDeleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Katalog Produk"
        description={
          meta ? (
            <>
              <span className="font-medium text-zinc-900 tabular-nums">{meta.total}</span> produk aktif di katalog
            </>
          ) : (
            "Kelola inventaris, harga, dan stok produk."
          )
        }
        actions={
          <Button onClick={openCreate} className="h-9 rounded-md bg-black px-3 text-white hover:bg-zinc-800">
            <Plus />
            Tambah Produk
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Cari nama atau kode produk…"
          className="sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <span className="micro-label hidden sm:inline">Urutkan</span>
          <Select
            items={SORT_OPTIONS}
            value={sort}
            onValueChange={(value) => {
              if (!value) return;
              setSort(value as ProductSort);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full rounded-md bg-white sm:w-52" aria-label="Urutkan produk">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : (
          <>
            <Table className={isPlaceholderData ? "opacity-60 transition-opacity duration-150" : undefined}>
              <TableHeader className="bg-zinc-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="micro-label w-16 px-4">Foto</TableHead>
                  <TableHead className="micro-label px-4">Kode</TableHead>
                  <TableHead className="micro-label px-4">Nama Produk</TableHead>
                  <TableHead className="micro-label px-4 text-right">Harga Satuan</TableHead>
                  <TableHead className="micro-label px-4">Stok</TableHead>
                  <TableHead className="micro-label px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeletonRows columns={COLUMNS} rows={PER_PAGE} />
                ) : products.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS}>
                      <EmptyState
                        icon={PackageSearch}
                        title={debouncedSearch ? "Produk tidak ditemukan" : "Belum ada produk"}
                        description={
                          debouncedSearch
                            ? `Tidak ada produk yang cocok dengan "${debouncedSearch}".`
                            : "Tambahkan produk pertama ke katalog Anda."
                        }
                        action={
                          !debouncedSearch && (
                            <Button variant="outline" size="sm" onClick={openCreate}>
                              <Plus />
                              Tambah Produk
                            </Button>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="h-14 border-zinc-100 hover:bg-zinc-50/60">
                      <TableCell className="px-4">
                        <ProductThumbnail src={product.image_url} alt={product.product_name} />
                      </TableCell>
                      <TableCell className="px-4 font-mono text-xs font-medium text-zinc-700">
                        {product.product_code}
                      </TableCell>
                      <TableCell className="px-4 font-medium text-zinc-900">{product.product_name}</TableCell>
                      <TableCell className="px-4 text-right font-medium text-zinc-900 tabular-nums">
                        {formatRupiah(product.price)}
                      </TableCell>
                      <TableCell className="px-4">
                        <StockBadge stock={product.stock} />
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${product.product_name}`}
                            onClick={() => openEdit(product)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus ${product.product_name}`}
                            className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => openDelete(product)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta && meta.total > 0 && (
              <DataPagination meta={meta} onPageChange={setPage} disabled={isPlaceholderData} />
            )}
          </>
        )}
      </div>

      <ProductDialog open={formOpen} onOpenChange={setFormOpen} product={selected} />
      <ProductDeleteDialog product={selected} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
