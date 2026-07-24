"use client";

import { useState } from "react";
import { Store, Tag, Sparkles, UserCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  currentPoints: number;
  unlockedTitles: string[];
  activeTitle: string | null;
  avatarUnlocked: boolean;
}

const AVAILABLE_TITLES = [
  "Sang Jagoan",
  "Sang Ahli Coding",
  "Sang Ahli Prompt",
  "Kompetitor Handal",
  "Si Paling Rajin",
  "Raja Kuis",
  "Bintang Kelas",
  "Pahlawan Belajar",
  "Penguasa Materi",
  "Master Logika",
];

export default function TitleShop({ currentPoints, unlockedTitles, activeTitle, avatarUnlocked }: Props) {
  const [points, setPoints] = useState(currentPoints);
  const [ownedTitles, setOwnedTitles] = useState<string[]>(unlockedTitles || []);
  const [currentActive, setCurrentActive] = useState<string | null>(activeTitle);
  const [isAvatarUnlocked, setIsAvatarUnlocked] = useState(avatarUnlocked);
  const [loadingTitle, setLoadingTitle] = useState<string | null>(null);
  const [buyingPass, setBuyingPass] = useState(false);

  const handleBuyTitle = async (title: string) => {
    if (points < 5) {
      toast.error("Poin tidak cukup!");
      return;
    }
    
    setLoadingTitle(title);
    try {
      const res = await fetch("/api/student/shop/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Berhasil membeli titel: ${title}`);
        setPoints(points - 5);
        setOwnedTitles([...ownedTitles, title]);
      } else {
        toast.error(data.error || "Gagal membeli titel");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoadingTitle(null);
    }
  };

  const handleEquipTitle = async (title: string) => {
    setLoadingTitle(title);
    try {
      const res = await fetch("/api/student/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      if (res.ok) {
        toast.success(`Titel dipasang: ${title}`);
        setCurrentActive(title);
      } else {
        toast.error("Gagal memasang titel");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoadingTitle(null);
    }
  };

  const handleBuyAvatarPass = async () => {
    if (points < 10) {
      toast.error("Poin tidak cukup!");
      return;
    }
    
    setBuyingPass(true);
    try {
      const res = await fetch("/api/student/shop/avatar-pass", {
        method: "POST",
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success("Avatar Pass berhasil dibeli! Fitur Avatar Maker sekarang terbuka.");
        setPoints(points - 10);
        setIsAvatarUnlocked(true);
        // Refresh page to load the new Avatar Maker component which we will add later
        window.location.reload(); 
      } else {
        toast.error(data.error || "Gagal membeli Avatar Pass");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setBuyingPass(false);
    }
  };

  return (
    <div className="card-soft p-6 md:p-8 relative overflow-hidden bg-white border-2 border-purple-100">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
          <Store className="w-7 h-7 text-purple-600" />
          Toko Spesial
        </h2>
        <div className="bg-purple-50 border border-purple-100 px-4 py-1.5 rounded-full shadow-inner">
          <span className="font-bold text-gray-500 mr-2 text-sm">Saldo Poin:</span>
          <span className="font-black text-purple-600 text-lg">{points}</span>
        </div>
      </div>

      {/* Avatar Pass Section */}
      <div className="mb-10 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-100 relative z-10 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2 mb-2">
            <UserCircle className="w-6 h-6 text-indigo-600" />
            Avatar Pass (Pembuat Avatar)
          </h3>
          <p className="text-indigo-700/80 text-sm font-medium mb-4">
            Buka fitur tersembunyi untuk membuat avatar spesialmu sendiri! Pilih model rambut, gaya mata, mulut, dan warna favoritmu untuk ditampilkan di Leaderboard.
          </p>
          <div className="flex items-center gap-2 font-black text-indigo-900 bg-white/60 w-fit px-4 py-1.5 rounded-full shadow-sm">
            💎 10 Poin
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          {isAvatarUnlocked ? (
            <button disabled className="w-full bg-green-100 text-green-700 font-bold py-3 px-6 rounded-xl border border-green-200 cursor-not-allowed flex justify-center items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5" /> Sudah Dimiliki
            </button>
          ) : (
            <button 
              onClick={handleBuyAvatarPass}
              disabled={buyingPass || points < 10}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {buyingPass ? "Memproses..." : "Beli Avatar Pass"}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Tag className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-bold text-gray-800">Titel Keren (5 Poin/Titel)</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {AVAILABLE_TITLES.map((title) => {
          const isOwned = ownedTitles.includes(title);
          const isActive = currentActive === title;
          const isLoading = loadingTitle === title;

          return (
            <div 
              key={title} 
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${
                isActive 
                  ? 'border-blue-400 bg-blue-50 shadow-sm' 
                  : isOwned 
                    ? 'border-gray-200 bg-gray-50' 
                    : 'border-purple-100 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-bold text-gray-800 text-base">{title}</div>
                {isActive && (
                  <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div>
                {!isOwned ? (
                  <button
                    onClick={() => handleBuyTitle(title)}
                    disabled={isLoading || points < 5}
                    className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-2 rounded-xl text-sm transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {isLoading ? "..." : "Beli (5 Poin)"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquipTitle(title)}
                    disabled={isLoading || isActive}
                    className={`w-full font-bold py-2 rounded-xl text-sm transition-all flex justify-center items-center ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {isLoading ? "..." : (isActive ? "Terpasang" : "Pasang Titel")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
