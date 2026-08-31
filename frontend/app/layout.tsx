import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { settingsApi } from "@/lib/settingsApi";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display face for guest-facing headings only — gives the resort
// site a warmer, less "SaaS dashboard" feel. Admin panel stays sans-only.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-stone-800">{children}</body>
    </html>
  );
}
