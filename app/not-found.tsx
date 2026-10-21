import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { NotFoundContent } from "@/components/site/NotFoundContent";

/**
 * Global 404. Unmatched URLs render outside the (site) route group, so the
 * header and footer are included here explicitly.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
