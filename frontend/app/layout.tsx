import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Outfit } from "next/font/google";
import { settingsApi } from "@/lib/settingsApi";
import IconSprite from "@/components/site/IconSprite";
import BackToTop from "@/components/BackToTop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display + body faces for guest-facing pages only — matches the
// coccolobo-beach-club.html design system. Admin panel stays Geist-only.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await settingsApi.getSettings();
  return {
    title: {
      default: `${name} — Excursions & Activities`,
      template: `%s | ${name}`,
    },
    description: `Book excursions and activities at ${name}.`,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-stone-800">
        {children}
        <IconSprite />
        <BackToTop />
      </body>
    </html>
  );
}
