"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";

type FormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl tracking-[0.25em] text-brand-900 block mb-10 text-center">EL HUYAM</Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-brand-900 mb-3">Check your email</h1>
            <p className="text-brand-400 text-sm mb-8">If an account exists with that email, a password reset link has been sent.</p>
            <Link href="/auth/login">
              <Button variant="luxury-outline">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl text-brand-900 mb-2">Reset Password</h1>
            <p className="text-brand-400 text-sm mb-8">Enter your email and we will send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email Address" type="email" {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
              <Button type="submit" variant="luxury" size="lg" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>

            <p className="text-center text-sm text-brand-400 mt-8">
              <Link href="/auth/login" className="text-brand-700 hover:text-brand-900 uppercase tracking-widest text-xs">← Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
