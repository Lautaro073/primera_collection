import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreCartProvider } from "@/components/storefront/StoreCartProvider";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "De Primera Collection",
  description:
    "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos. Encontra las mejores marcas y los ultimos lanzamientos para potenciar tu rendimiento.",
  icons: {
    icon: "/assets/deprimeracollection.jpg",
    shortcut: "/assets/deprimeracollection.jpg",
    apple: "/assets/deprimeracollection.jpg",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StoreCartProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <StoreFooter />
          </div>
        </StoreCartProvider>
      </body>
    </html>
  );
}
