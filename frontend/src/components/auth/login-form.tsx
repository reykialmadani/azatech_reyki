"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FormField } from "@/components/shared/form-field";
import { useAuthToken, useLogin } from "@/hooks/use-auth";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const expired = useSearchParams().get("expired") === "true";
  const token = useAuthToken();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Sudah login: tidak perlu melihat form lagi.
  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const onSubmit = (values: LoginValues) => loginMutation.mutate(values);

  const serverError = loginMutation.error?.message;
  const isPending = loginMutation.isPending || loginMutation.isSuccess;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError ? (
        <Notice tone="error">{serverError}</Notice>
      ) : (
        expired && <Notice tone="neutral">Sesi Anda telah berakhir. Silakan masuk kembali.</Notice>
      )}

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@azatech.id"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-10 bg-zinc-50"
          {...register("email")}
        />
      </FormField>

      <FormField id="password" label="Password" error={errors.password?.message}>
        <InputGroup className="h-10 bg-zinc-50">
          <InputGroupInput
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </FormField>

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 h-10 rounded-md bg-black text-sm text-white hover:bg-zinc-800"
      >
        {isPending && <Loader2 className="animate-spin" />}
        {isPending ? "Memproses…" : "Masuk ke Akun"}
      </Button>
    </form>
  );
}

function Notice({ tone, children }: { tone: "error" | "neutral"; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          : "flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700"
      }
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
