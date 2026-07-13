"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ScrollToTopTrigger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // `<html>` has the Tailwind `scroll-smooth` class, and an un-opinionated
    // window.scrollTo(0, 0) call inherits that CSS scroll-behavior, animating
    // instead of jumping. Explicit "instant" bypasses it so navigation always
    // resets to top immediately, with no visible scroll animation.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, searchParams]);

  return null;
}

export default function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollToTopTrigger />
    </Suspense>
  );
}
