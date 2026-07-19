"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back");
        
        const session = await getSession();
        const role = (session?.user as { role?: string } | null | undefined)?.role;

        if (role === "ADMIN" || role === "CONFIRMATRICE") {
          router.push("/admin");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-warm-white flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-center">
          <Link href="/" className="font-display text-4xl tracking-[0.3em] text-white block mb-2">
            EL HUYAM
          </Link>
          <div className="font-serif text-3xl tracking-[0.15em] text-white/85 block mb-6 select-none" dir="rtl">
            الهُيَام
          </div>
          <div className="w-8 h-px bg-white/30 mx-auto mb-6" />
          <p className="font-display text-xl text-white italic leading-relaxed max-w-xs">
            &ldquo;Stay classy and modest with us.&rdquo;
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="font-display text-2xl tracking-[0.25em] text-brand-900 block">
              EL HUYAM
            </Link>
            <div className="font-serif text-xl tracking-[0.1em] text-brand-900/80 block mt-1 select-none" dir="rtl">
              الهُيَام
            </div>
          </div>

          <h1 className="font-display text-3xl text-black mb-2">Welcome back</h1>
          <p className="text-black/80 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-black/70 hover:text-black transition-colors uppercase tracking-widest font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-black text-white border border-black hover:border-soft-gold hover:bg-neutral-950 relative overflow-hidden group shadow-md transition-all duration-300 rounded-none h-12 uppercase tracking-[0.25em] text-xs font-semibold flex items-center justify-center gap-2"
              loading={loading}
            >
              <span className="relative z-10 group-hover:scale-105 transition-transform duration-200">
                Sign In
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-soft-gold/10 via-transparent to-soft-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Button>
          </form>


          <p className="text-center text-sm text-black/70 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-black hover:text-black/70 font-bold transition-colors uppercase tracking-widest text-xs">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
