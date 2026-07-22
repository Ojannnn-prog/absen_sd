import CalendarWidget from "@/components/CalendarWidget";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import { QrCode, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  
  // If user is already logged in, redirect them to their respective dashboard
  if (session) {
    if (session.role === "admin") {
      redirect("/admin");
    } else if (session.role === "student") {
      redirect("/student");
    }
  }

  return (
    <div className="flex flex-col gap-8 md:gap-12 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-8 py-4">
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-header leading-tight">
            Absensi Lebih Cepat <br className="hidden md:block"/> dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">QR Code</span>
          </h1>
          <p className="text-lg text-text-body max-w-xl">
            Sistem absensi modern untuk SDN 231 Sukaasih. Pindai QR Code untuk mencatat kehadiran secara *real-time* dan transparan.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/admin/scanner" className="btn-primary flex items-center gap-2 px-6 py-3 text-lg shadow-md shadow-primary/20">
              <QrCode className="w-5 h-5" />
              Scan QR Sekarang
            </Link>
            <Link href="/student" className="flex items-center gap-2 px-6 py-3 font-semibold text-gray-600 hover:text-primary transition-colors">
              Masuk sebagai Siswa
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/3 min-w-[300px]">
          <CalendarWidget />
        </div>
      </section>

      {/* Main Dashboard Section */}
      <section className="pt-4 border-t border-gray-100">
        <AnnouncementBoard />
      </section>
    </div>
  );
}
