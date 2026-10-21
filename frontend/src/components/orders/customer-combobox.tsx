"use client";

import { useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { useCustomers } from "@/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/customer";

interface CustomerComboboxProps {
  id?: string;
  value: Customer | null;
  onSelect: (customer: Customer) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
}

// Pencarian dilakukan di server (data pelanggan bisa ratusan baris).
export function CustomerCombobox({
  id,
  value,
  onSelect,
  invalid,
  placeholder = "Cari & pilih pelanggan…",
  className,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const { data, isPending, isFetching } = useCustomers(
    { search: debouncedSearch, per_page: 8 },
    { enabled: open },
  );
  const customers = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-sm transition-colors duration-150 outline-none hover:bg-zinc-50 focus-visible:ring-3 focus-visible:ring-ring/50",
          invalid && "border-red-600 ring-3 ring-red-600/20",
          className,
        )}
      >
        {value ? (
          <span className="truncate font-medium text-zinc-900">{value.customer_name}</span>
        ) : (
          <span className="truncate text-zinc-500">{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 p-0 shadow-sm">
        <Command shouldFilter={false} className="rounded-lg!">
          <CommandInput value={search} onValueChange={setSearch} placeholder="Ketik nama atau no. HP…" />
          <CommandList>
            {isPending ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" />
                Memuat pelanggan…
              </div>
            ) : (
              <>
                <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                <CommandGroup className={cn(isFetching && "opacity-60")}>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      data-checked={value?.id === customer.id}
                      onSelect={() => {
                        onSelect(customer);
                        setOpen(false);
                      }}
                      className="gap-3 py-2"
                    >
                      <CustomerAvatar name={customer.customer_name} className="size-7 text-[10px]" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-zinc-900">{customer.customer_name}</span>
                        <span className="truncate text-xs text-zinc-500">
                          {customer.phone ?? "Tanpa no. HP"} · {customer.customer_address}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
