import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { PageTransition } from "@/components/admin/page-transition";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-[84px]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
