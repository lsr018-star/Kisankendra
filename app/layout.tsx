import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "Kisankendra — Kisan ka Saathi, Har Khet ke Liye",
  description:
    "Agricultural marketplace and partner-shop ERP/CRM for Seoni Malwa and nearby villages, Narmadapuram district, Madhya Pradesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream font-sans text-neutral-900 antialiased">
        <LanguageProvider>
          <CartProvider>
            <Header />
            <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 py-5">{children}</main>
            <Footer />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
