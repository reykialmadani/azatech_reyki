import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { Navbar } from "@/components/layout/navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </AuthGuard>
  );
}
