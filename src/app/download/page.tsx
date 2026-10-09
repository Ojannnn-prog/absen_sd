import { getAppMarketplaceData } from "@/app/actions/appMarketplace";
import PlayStoreAppMarketplace from "@/components/PlayStoreAppMarketplace";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Aplikasi Android APK",
  description: "Download resmi aplikasi Android Absensi SDN 231 Sukaasih, bebas malware, dengan fitur Scan QR & Wajah AI.",
};

export default async function DownloadPage() {
  const { stats, reviews } = await getAppMarketplaceData();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          Versi Resmi 1.0.0
        </span>
      </div>

      <PlayStoreAppMarketplace initialStats={stats} initialReviews={reviews} />
    </div>
  );
}
