"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
      };
      const lastOrderNumber = getCookie("last_placed_order");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, lastOrderNumber }),
      });

      const result = await res.json();
      if (!result.success) {
        toast.error(result.error ?? "Registration failed");
        return;
      }

      // Auto sign in
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        toast.success("Welcome to EL HUYAM!");
        router.push("/account");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-12">
        <div className="text-center">
          <Link href="/" className="font-display text-4xl tracking-[0.3em] text-white block mb-6">EL HUYAM</Link>
          <div className="w-8 h-px bg-brand-500 mx-auto mb-6" />
          <p className="font-display text-xl text-brand-300 italic leading-relaxed max-w-xs">
            &ldquo;Join a community that celebrates grace, modesty, and timeless elegance.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-display text-2xl tracking-[0.25em] text-brand-900 block mb-10 text-center">EL HUYAM</Link>

          <h1 className="font-display text-3xl text-brand-900 mb-2">Create Account</h1>
          <p className="text-brand-400 text-sm mb-8">Join the House of Huyaam</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register("name")} error={errors.name?.message} placeholder="Fatima Al-Nour" />
            <Input label="Email Address" type="email" {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
            <Input label="Password" type="password" {...register("password")} error={errors.password?.message} placeholder="Min. 8 characters" />
            <Input label="Confirm Password" type="password" {...register("confirmPassword")} error={errors.confirmPassword?.message} placeholder="••••••••" />

            <Button type="submit" variant="luxury" size="lg" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-200" /></div>
            <div className="relative flex justify-center"><span className="bg-warm-white px-4 text-xs uppercase tracking-widest text-brand-400">or</span></div>
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => signIn("google", { callbackUrl: "/account" })}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-brand-400 mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-700 hover:text-brand-900 font-medium transition-colors uppercase tracking-widest text-xs">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
