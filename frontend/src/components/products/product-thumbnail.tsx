"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

// Gambar bersifat opsional; URL kosong / gagal dimuat jatuh ke ikon paket.
export function ProductThumbnail({ src, alt, className }: ProductThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50",
        className,
      )}
    >
      {showImage ? (
        // URL gambar bebas dari pengguna, jadi domainnya tidak bisa didaftarkan ke next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <Package className="size-4 text-zinc-400" strokeWidth={1.5} aria-hidden />
      )}
    </div>
  );
}
