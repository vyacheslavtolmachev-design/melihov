import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SideOrnaments } from "@/components/layout/SideOrnaments";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { GoldDefs } from "@/components/brand/GoldDefs";
import { site } from "@/lib/site";

const playfair = Playfair_Display({
  subsets: ["cyrillic", "latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} — ${site.tagline} ${site.founder}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${playfair.variable} ${manrope.variable}`}>
      <body className="flex min-h-svh flex-col">
        <GoldDefs />
        <SideOrnaments />
        <MotionProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
