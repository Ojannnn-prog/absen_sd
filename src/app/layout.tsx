import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import ToastProvider from "@/components/ToastProvider";
import CookieConsent from "@/components/CookieConsent";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Sistem Absensi SDN 231 Sukaasih",
    template: "%s | SDN 231 Sukaasih",
  },
  description: "Sistem absensi QR Code, portal belajar, dan gamifikasi SDN 231 Sukaasih.",
  applicationName: "Sistem Absensi SDN 231 Sukaasih",
  authors: [{ name: "SDN 231 Sukaasih" }],
  creator: "SDN 231 Sukaasih",
  publisher: "SDN 231 Sukaasih",
  keywords: ["absensi QR Code", "SDN 231 Sukaasih", "portal belajar", "e-learning SD"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SDN 231 Sukaasih",
    title: "Sistem Absensi SDN 231 Sukaasih",
    description: "Sistem absensi QR Code, portal belajar, dan gamifikasi SDN 231 Sukaasih.",
    images: [
      {
        url: "/og-image.png",
        width: 1890,
        height: 704,
        alt: "Sistem Absensi SDN 231 Sukaasih",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistem Absensi SDN 231 Sukaasih",
    description: "Sistem absensi QR Code, portal belajar, dan gamifikasi SDN 231 Sukaasih.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="id" className={`${plusJakartaSans.variable}`}>
      <body className="bg-bg-light min-h-screen flex flex-col font-sans text-gray-800 antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        <ToastProvider />
        <CookieConsent />
        <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-gray-100/50 supports-[backdrop-filter]:bg-white/40 px-6 py-4 flex justify-between items-center transition-all duration-300 relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              SD
            </div>
            <h1 className="text-xl font-extrabold text-text-header tracking-tight">SDN 231 Sukaasih</h1>
          </div>
          <Navbar role={session?.role || null} />
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-sm text-text-body mt-auto">
          &copy; {new Date().getFullYear()} SDN 231 Sukaasih. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
