"use client";

import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Input terkontrol; debounce dilakukan di halaman lewat useDebounce.
export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <InputGroup className={cn("h-9 bg-white", className)}>
      <InputGroupAddon>
        <Search className="text-zinc-400" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? "Cari"}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Hapus pencarian" onClick={() => onChange("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
