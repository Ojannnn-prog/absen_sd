"use client";

import { useState } from "react";
import { markAsCompleted } from "./actions";
import toast from "react-hot-toast";
import { PlayCircle, CheckCircle2, Circle, FileText, Video, Image as ImageIcon, Headphones, ChevronRight, Loader2, Trophy } from "lucide-react";

export default function CourseClient({ resources, completedIds: initialCompleted }: { resources: any[], completedIds: string[] }) {
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompleted);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const activeResource = resources[currentIndex];
  const progressPercent = resources.length === 0 ? 0 : Math.round((completedIds.length / resources.length) * 100);
  const isAllDone = completedIds.length === resources.length && resources.length > 0;

  const getTypeIcon = (t: string, isActive: boolean, isCompleted: boolean) => {
    const colorClass = isCompleted ? "text-green-500" : isActive ? "text-[var(--theme-primary,var(--color-primary))]" : "text-gray-400";
    switch (t) {
      case "Video": return <Video className={`w-5 h-5 ${colorClass}`} />;
      case "Audio": return <Headphones className={`w-5 h-5 ${colorClass}`} />;
      case "Photo": return <ImageIcon className={`w-5 h-5 ${colorClass}`} />;
      default: return <FileText className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const handleMarkAsDone = async () => {
    if (!activeResource) return;
    setIsCompleting(true);
    
    try {
      if (!completedIds.includes(activeResource.id)) {
        const res = await markAsCompleted(activeResource.id);
        if (res.success) {
          setCompletedIds([...completedIds, activeResource.id]);
          toast.success("Materi diselesaikan! 🎉");
        } else {
          toast.error(res.message || "Gagal");
          setIsCompleting(false);
          return;
        }
      }

      // Move to next
      if (currentIndex < resources.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast.success("Selamat! Anda telah menyelesaikan semua materi!", { icon: "🏆" });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsCompleting(false);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Belum Ada Materi</h2>
        <p className="text-gray-500 mt-2">Admin belum menambahkan sumber belajar apa pun.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header & Progress Bar */}
      <div className="card-soft p-5 bg-white flex flex-col gap-4 lg:sticky lg:top-20 z-30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              Ruang Belajar <span className="bg-[var(--theme-primary,var(--color-primary))]/10 text-[var(--theme-primary,var(--color-primary))] px-3 py-1 rounded-full text-sm">Beta</span>
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              Progres Anda: {completedIds.length} dari {resources.length} Materi ({progressPercent}%)
            </p>
          </div>
          {isAllDone && (
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg animate-pulse">
              <Trophy className="w-5 h-5" /> Course Selesai!
            </div>
          )}
        </div>
        
        {/* Progress Bar Track */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area (Video/Embed) */}
        <div className="flex-1 flex flex-col gap-4">
          {activeResource && (
            <div className="card-soft overflow-hidden bg-white flex flex-col shadow-xl border-2 border-transparent hover:border-[var(--theme-primary,var(--color-primary))]/20 transition-all">
              {/* Google Drive Embed Iframe */}
              <div className="relative w-full pb-[56.25%] bg-gray-900 border-b border-gray-100">
                <iframe 
                  src={activeResource.driveUrl} 
                  className="absolute top-0 left-0 w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{activeResource.title}</h2>
                    <p className="text-gray-500 mt-2 text-lg">{activeResource.description}</p>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl whitespace-nowrap">
                    ⏳ {activeResource.durationMins} Menit
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  {completedIds.includes(activeResource.id) && currentIndex === resources.length - 1 ? (
                    <button disabled className="px-8 py-4 bg-green-100 text-green-700 font-black rounded-2xl flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" /> Selesai!
                    </button>
                  ) : (
                    <button 
                      onClick={handleMarkAsDone}
                      disabled={isCompleting}
                      className="w-full md:w-auto px-8 py-4 bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 text-white font-black rounded-2xl shadow-xl shadow-[var(--theme-primary,var(--color-primary))]/30 transition-all flex items-center justify-center gap-2 group transform hover:-translate-y-1"
                    >
                      {isCompleting ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                       completedIds.includes(activeResource.id) ? "Lanjut Materi Berikutnya" : "Tandai Selesai & Lanjut"}
                      {!isCompleting && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Playlist */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="card-soft p-4 bg-white lg:sticky lg:top-48 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            <h3 className="font-extrabold text-gray-900 mb-4 px-2">Daftar Materi</h3>
            <div className="flex flex-col gap-2">
              {resources.map((res, idx) => {
                const isActive = currentIndex === idx;
                const isCompleted = completedIds.includes(res.id);
                
                return (
                  <button
                    key={res.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`text-left p-3 rounded-2xl flex items-start gap-3 transition-all ${
                      isActive ? 'bg-[var(--theme-primary,var(--color-primary))]/10 ring-2 ring-[var(--theme-primary,var(--color-primary))]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : isActive ? (
                        <PlayCircle className="w-6 h-6 text-[var(--theme-primary,var(--color-primary))]" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-bold line-clamp-2 ${isActive ? 'text-[var(--theme-primary,var(--color-primary))]' : 'text-gray-700'}`}>
                        {idx + 1}. {res.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(res.type, isActive, isCompleted)}
                        <span className="text-xs font-semibold text-gray-500 uppercase">{res.type}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-gray-500">{res.durationMins}m</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dummy icon to avoid crash if resources empty
import { BookOpen } from "lucide-react";
