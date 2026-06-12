"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
    }
  }, [token]);

  async function onSubmit(data: FormData) {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error ?? "Failed to reset password"); return; }
      setSuccess(true);
      toast.success("Password updated successfully");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="text-center">
          <p className="text-brand-900 font-display text-xl mb-4">Invalid reset link</p>
          <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:text-brand-900 uppercase tracking-widest">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-[0.2em] text-brand-900">EL HUYAAM</Link>
          <h1 className="font-display text-xl text-brand-800 mt-6">Set New Password</h1>
          <p className="text-brand-400 text-sm mt-2">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="bg-white border border-green-200 p-6 text-center">
            <p className="text-green-700 font-medium">Password updated!</p>
            <p className="text-brand-400 text-sm mt-1">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-brand-100 p-8 space-y-5">
            <Input
              label="New Password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              placeholder="Min. 8 characters"
            />
            <Input
              label="Confirm Password"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
              placeholder="Repeat your password"
            />
            <Button type="submit" variant="luxury" className="w-full" loading={isSubmitting}>
              Update Password
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-brand-400 mt-6">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-brand-700 hover:text-brand-900 uppercase tracking-widest">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
