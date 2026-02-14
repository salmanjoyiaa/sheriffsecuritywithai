import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8B1A1A",
};

export const metadata: Metadata = {
  title: "Sheriff Security Company Pvt. Ltd | Elite Security Services Pakistan",
  description:
    "Professional security services across Pakistan since 2004. Expert bodyguards, security systems, walk-through gates, metal detectors, and comprehensive protection. Trusted by 100+ leading brands including Khaadi, KFC, and more.",
  keywords: [
    "security company pakistan",
    "sheriff security",
    "professional guards pakistan",
    "body guards services",
    "security services karachi",
    "security systems pakistan",
    "walk through gates",
    "metal detectors",
    "event security pakistan",
    "corporate security",
    "elite security force",
    "security personnel",
  ],
  authors: [{ name: "Sheriff Security Company Pvt. Ltd" }],
  creator: "Sheriff Security",
  publisher: "Sheriff Security Company Pvt. Ltd",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://sheriffsecurity.pk",
    title: "Sheriff Security Company Pvt. Ltd | Elite Security Services Pakistan",
    description: "The Name of Conservation - Professional Security Services since 2004. Trusted by Pakistan's leading brands.",
    siteName: "Sheriff Security",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheriff Security Company Pvt. Ltd",
    description: "Professional Security Services - The Name of Conservation",
  },
  alternates: {
    canonical: "https://sheriffsecurity.pk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
