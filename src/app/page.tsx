import CalendarWidget from "@/components/CalendarWidget";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import LeaderboardView from "@/components/LeaderboardView";
import PlayStoreAppMarketplace from "@/components/PlayStoreAppMarketplace";
import { LogIn, ArrowRight, Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAppMarketplaceData } from "@/app/actions/appMarketplace";

export default async function Home() {
  const session = await getSession();
  
  // If user is already logged in, redirect them to their respective dashboard
  if (session) {
    if (session.role === "admin") {
      redirect("/admin");
    } else if (session.role === "teacher") {
      redirect("/teacher");
    } else if (session.role === "student") {
      redirect("/student");
    }
  }

  const { stats, reviews } = await getAppMarketplaceData();

  return (
    <div className="flex flex-col gap-8 md:gap-12 animate-in fade-in duration-500">
      {/* Hero Welcome & Quick Portal Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-8 py-2">
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img src="/icon.svg" alt="Logo Absensi" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-lg" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-text-header leading-tight">
              Absensi Cerdas dengan <strong className="font-extrabold text-text-header">QR Code & Wajah AI</strong>
            </h1>
          </div>

          <p className="text-base sm:text-lg text-text-body max-w-xl">
            Sistem presensi modern dan portal belajar SDN 231 Sukaasih. Kini hadir dalam versi web dan aplikasi mobile Android mandiri yang dapat dipasang langsung.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link 
              href="/login" 
              className="btn-primary inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-primary/25 rounded-2xl hover:opacity-95 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Login Portal Web
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <a 
              href="#app-marketplace" 
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200/70 transition-colors shadow-sm"
            >
              <Smartphone className="w-5 h-5" />
              Download Aplikasi Android
            </a>
          </div>
        </div>

        <div className="w-full lg:w-1/3 min-w-0 sm:min-w-[300px]">
          <CalendarWidget />
        </div>
      </section>

      {/* Play Store App Marketplace Section */}
      <section id="app-marketplace" className="pt-4 border-t border-gray-100">
        <PlayStoreAppMarketplace initialStats={stats} initialReviews={reviews} />
      </section>

      {/* Main Dashboard Info & Leaderboard Section */}
      <section className="pt-6 border-t border-gray-100 flex flex-col gap-8">
        <AnnouncementBoard />
        
        <div className="w-full">
          <LeaderboardView />
        </div>
      </section>
    </div>
  );
}
