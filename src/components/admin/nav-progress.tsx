"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Ultra-thin navigation progress bar — like GitHub/YouTube/Linear.
 * No dependencies, pure CSS animation, imperceptible weight.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Route changed → finish bar
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setProgress(100);
    timerRef.current = setTimeout(() => setVisible(false), 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  // Expose a start function for the NavItem to call
  useEffect(() => {
    const start = () => {
      setVisible(true);
      setProgress(0);
      // Animate to ~85% quickly, then slow down (natural feel)
      let p = 0;
      const tick = () => {
        p += p < 50 ? 8 : p < 80 ? 3 : 0.5;
        if (p < 90) {
          setProgress(p);
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    window.__navProgressStart = start;
    return () => { delete window.__navProgressStart; };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 300ms ease" }}
    >
      <div
        className="h-full bg-white/90 transition-[width] ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "400ms",
          boxShadow: "0 0 8px rgba(255,255,255,0.8)",
        }}
      />
    </div>
  );
}

// Global type augmentation
declare global {
  interface Window {
    __navProgressStart?: () => void;
  }
}
