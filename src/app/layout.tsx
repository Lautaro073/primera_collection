import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "De Primera Collection",
  description:
    "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos. Encontra las mejores marcas y los ultimos lanzamientos para potenciar tu rendimiento.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/assets/deprimeracollection.jpg",
    shortcut: "/assets/deprimeracollection.jpg",
    apple: "/assets/deprimeracollection.jpg",
  },
  openGraph: {
    title: "De Primera Collection",
    description:
      "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos.",
    url: "/",
    siteName: "De Primera Collection",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/assets/deprimeracollection.jpg",
        alt: "De Primera Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "De Primera Collection",
    description:
      "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos.",
    images: ["/assets/deprimeracollection.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
