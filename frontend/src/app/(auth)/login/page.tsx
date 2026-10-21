import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl font-black tracking-[0.25em] text-black">AZATECH</span>
            <span className="rounded-sm bg-black px-1 py-px text-[10px] font-semibold tracking-wider text-white">
              STORE
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Sistem Order Management &amp; Katalog</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 sm:p-8">
          <h1 className="mb-6 text-lg font-medium tracking-tight text-zinc-900">Masuk ke akun admin</h1>
          {/* useSearchParams (?expired=true) wajib berada di dalam Suspense. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Azatech · Internal use only
        </p>
      </div>
    </main>
  );
}
