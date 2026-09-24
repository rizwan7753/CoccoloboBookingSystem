import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { CartProvider } from "@/components/site/CartContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-shell">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </CartProvider>
  );
}
