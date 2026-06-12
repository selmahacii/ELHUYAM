"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * PageTransition — wraps admin page content with a ultra-fast fade+slide.
 * Uses CSS only (no JS animation loop) for 0-overhead transitions.
 * Triggers on every pathname change while keeping layout stable.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset and replay the animation on route change
    el.style.animation = "none";
    // Force reflow
    void el.offsetHeight;
    el.style.animation = "";
  }, [pathname]);

  return (
    <div
      ref={ref}
      style={{
        animation: "adminPageIn 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {children}
    </div>
  );
}
