import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full border border-red-200 bg-red-50">
        <CloudOff className="size-5 text-red-600" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900">Gagal memuat data</p>
        <p className="text-sm text-zinc-500">{message ?? "Terjadi kesalahan saat menghubungi server."}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw />
          Coba lagi
        </Button>
      )}
    </div>
  );
}
