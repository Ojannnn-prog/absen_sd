"use client";

import { useState } from "react";
import { ShoppingBag, CheckCircle2, Lock, Palette } from "lucide-react";
import toast from "react-hot-toast";
import { buyTheme, equipTheme } from "@/app/student/actions";
import { useRouter } from "next/navigation";

interface ThemeOption {
  id: string;
  name: string;
  price: number;
  color: string;
}

const AVAILABLE_THEMES: ThemeOption[] = [
  { id: "default", name: "Biru Klasik", price: 0, color: "bg-blue-500" },
  { id: "pink", name: "Sakura Pink", price: 10, color: "bg-pink-500" },
  { id: "green", name: "Nature Green", price: 10, color: "bg-emerald-500" },
  { id: "gold", name: "Royal Gold", price: 30, color: "bg-yellow-500" },
];

export default function ThemeShop({ 
  currentPoints, 
  unlockedThemes, 
  activeTheme 
}: { 
  currentPoints: number, 
  unlockedThemes: string[], 
  activeTheme: string 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (theme: ThemeOption) => {
    setIsLoading(theme.id);
    try {
      if (unlockedThemes.includes(theme.id)) {
        // Equip theme
        const res = await equipTheme(theme.id);
        if (res.success) {
          toast.success(`Tema ${theme.name} berhasil dipakai!`);
          router.refresh();
        } else {
          toast.error(res.message || "Gagal memakai tema");
        }
      } else {
        // Buy theme
        if (currentPoints < theme.price) {
          toast.error("Poin Anda tidak cukup!");
          setIsLoading(null);
          return;
        }
        const res = await buyTheme(theme.id, theme.price);
        if (res.success) {
          toast.success(`Berhasil membeli Tema ${theme.name}!`);
          router.refresh();
        } else {
          toast.error(res.message || "Gagal membeli tema");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="card-soft p-6 border-2 border-[var(--theme-primary,var(--color-primary))] bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[var(--theme-primary,var(--color-primary))]" />
          Toko Tema (Shop)
        </h2>
        <div className="px-4 py-1.5 bg-[var(--theme-primary,var(--color-primary))] text-white rounded-full font-bold shadow-md animate-pulse">
          {currentPoints} Poin
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {AVAILABLE_THEMES.map((theme) => {
          const isUnlocked = unlockedThemes.includes(theme.id);
          const isActive = activeTheme === theme.id;
          const isProcessing = isLoading === theme.id;

          return (
            <div 
              key={theme.id} 
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 flex flex-col
                ${isActive ? 'border-[var(--theme-primary,var(--color-primary))] ring-4 ring-[var(--theme-primary,var(--color-primary))]/20' : 'border-gray-100 hover:border-gray-300'}
                ${!isUnlocked && currentPoints < theme.price ? 'opacity-70 grayscale-[30%]' : ''}
              `}
            >
              {/* Color Preview Header */}
              <div className={`h-16 w-full ${theme.color} flex items-center justify-center`}>
                <Palette className="w-8 h-8 text-white/80" />
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-gray-900">{theme.name}</h3>
                  {!isUnlocked && (
                    <p className="text-sm font-semibold text-yellow-600 flex items-center justify-center gap-1 mt-1">
                      💰 {theme.price} Poin
                    </p>
                  )}
                  {isUnlocked && !isActive && (
                    <p className="text-sm font-semibold text-green-600 mt-1">✓ Dimiliki</p>
                  )}
                  {isActive && (
                    <p className="text-sm font-bold text-[var(--theme-primary,var(--color-primary))] mt-1">Sedang Dipakai</p>
                  )}
                </div>

                <button
                  onClick={() => handleAction(theme)}
                  disabled={isProcessing || isActive || (!isUnlocked && currentPoints < theme.price)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${isActive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                      isUnlocked ? 'bg-[var(--theme-primary,var(--color-primary))] text-white hover:opacity-90 shadow-md shadow-[var(--theme-primary,var(--color-primary))]/20' : 
                      currentPoints >= theme.price ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : isActive ? (
                    <>Aktif</>
                  ) : isUnlocked ? (
                    <>Pakai Tema</>
                  ) : (
                    <>{currentPoints >= theme.price ? 'Beli Tema' : <><Lock className="w-4 h-4"/> Poin Kurang</>}</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
