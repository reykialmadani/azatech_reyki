"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage } from "@/lib/api/form-errors";
import { formatTanggal } from "@/lib/format";
import type { Customer } from "@/types/customer";
import { CustomerAvatar } from "./customer-avatar";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { CustomerDialog } from "./customer-dialog";

const PER_PAGE = 10;
const COLUMNS = 6;

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useCustomers({
    page,
    per_page: PER_PAGE,
    search: debouncedSearch,
  });

  const customers = data?.data ?? [];
  const meta = data?.meta;

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
  const openEdit = (customer: Customer) => {
    setSelected(customer);
    setFormOpen(true);
  };
  const openDelete = (customer: Customer) => {
    setSelected(customer);
    setDeleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pelanggan"
        description={
          meta ? (
            <>
              <span className="font-medium text-zinc-900 tabular-nums">{meta.total}</span> pelanggan terdaftar
            </>
          ) : (
            "Data pelanggan yang bertransaksi di toko."
          )
        }
        actions={
          <Button onClick={openCreate} className="h-9 rounded-md bg-black px-3 text-white hover:bg-zinc-800">
            <Plus />
            Tambah Pelanggan
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Cari nama atau nomor HP…"
        className="sm:max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : (
          <>
            <Table className={isPlaceholderData ? "opacity-60 transition-opacity duration-150" : undefined}>
              <TableHeader className="bg-zinc-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="micro-label px-4">Nama Pelanggan</TableHead>
                  <TableHead className="micro-label px-4">Jenis Kelamin</TableHead>
                  <TableHead className="micro-label px-4">No. HP</TableHead>
                  <TableHead className="micro-label px-4">Tanggal Lahir</TableHead>
                  <TableHead className="micro-label px-4">Alamat</TableHead>
                  <TableHead className="micro-label px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeletonRows columns={COLUMNS} rows={PER_PAGE} />
                ) : customers.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS}>
                      <EmptyState
                        icon={UserSearch}
                        title={debouncedSearch ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}
                        description={
                          debouncedSearch
                            ? `Tidak ada pelanggan yang cocok dengan "${debouncedSearch}".`
                            : "Tambahkan pelanggan pertama Anda."
                        }
                        action={
                          !debouncedSearch && (
                            <Button variant="outline" size="sm" onClick={openCreate}>
                              <Plus />
                              Tambah Pelanggan
                            </Button>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} className="h-14 border-zinc-100 hover:bg-zinc-50/60">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={customer.customer_name} />
                          <span className="font-medium text-zinc-900">{customer.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="inline-flex h-6 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-700">
                          {customer.gender}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 font-mono text-xs text-zinc-700">
                        {customer.phone ?? <span className="text-zinc-400">-</span>}
                      </TableCell>
                      <TableCell className="px-4 text-zinc-700 tabular-nums">
                        {formatTanggal(customer.birth_date)}
                      </TableCell>
                      <TableCell className="max-w-64 truncate px-4 text-zinc-700" title={customer.customer_address}>
                        {customer.customer_address}
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${customer.customer_name}`}
                            onClick={() => openEdit(customer)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus ${customer.customer_name}`}
                            className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => openDelete(customer)}
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

      <CustomerDialog open={formOpen} onOpenChange={setFormOpen} customer={selected} />
      <CustomerDeleteDialog customer={selected} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
