import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ScrollToTop from "@/components/layout/scroll-to-top";
import { PageTransition } from "@/components/admin/page-transition";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-[84px] min-h-[calc(100vh-84px)]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
