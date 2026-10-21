import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="micro-label">Error 404</span>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-zinc-500">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
      >
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
