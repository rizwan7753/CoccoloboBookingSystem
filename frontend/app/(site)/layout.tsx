import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppBubble from "@/components/site/WhatsAppBubble";
import { CartProvider } from "@/components/site/CartContext";
import { settingsApi } from "@/lib/settingsApi";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await settingsApi.getSettings();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-shell">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
      {settings.whatsappNumber && (
        <WhatsAppBubble name={settings.name} number={settings.whatsappNumber} message={settings.whatsappMessage} />
      )}
    </CartProvider>
  );
}
