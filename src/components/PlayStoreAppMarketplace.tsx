"use client";

import { useState } from "react";
import { 
  Download, 
  Star, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  ExternalLink, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Camera, 
  IdCard, 
  Trophy, 
  Bot, 
  Info,
  ThumbsUp,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { AppMarketplaceStats, AppReviewItem, recordAppDownload, submitAppReview } from "@/app/actions/appMarketplace";

interface PlayStoreAppMarketplaceProps {
  initialStats: AppMarketplaceStats;
  initialReviews: AppReviewItem[];
}

export default function PlayStoreAppMarketplace({
  initialStats,
  initialReviews,
}: PlayStoreAppMarketplaceProps) {
  const [stats, setStats] = useState(initialStats);
  const [reviews, setReviews] = useState(initialReviews);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState<{ [id: string]: boolean }>({});

  // Review Form State
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRole, setReviewerRole] = useState("Wali Murid");
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    toast.loading("Menyiapkan unduhan APK...", { id: "apk-dl" });

    try {
      // Rekam di database (counter download bertambah)
      const res = await recordAppDownload();
      if (res.success) {
        setStats((prev) => ({
          ...prev,
          totalDownloads: res.newTotal,
        }));
      }

      // Trigger direct download ke browser
      const link = document.createElement("a");
      link.href = "/downloads/Absensi-SDN231.apk";
      link.download = "Absensi-SDN231.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("File Absensi-SDN231.apk sedang diunduh! Cek notifikasi download HP Anda.", {
        id: "apk-dl",
        duration: 5000,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal memulai unduhan. Silakan gunakan link alternatif Google Drive.", {
        id: "apk-dl",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !commentInput.trim()) {
      toast.error("Nama dan komentar wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAppReview({
        name: reviewerName,
        role: reviewerRole,
        rating: ratingInput,
        comment: commentInput,
      });

      if (res.success) {
        toast.success("Terima kasih! Ulasan & masukan Anda berhasil dikirim.");
        
        // Optimistic update
        const newReview: AppReviewItem = {
          id: Date.now().toString(),
          name: reviewerName.trim(),
          role: reviewerRole,
          rating: ratingInput,
          comment: commentInput.trim(),
          createdAt: new Date().toISOString(),
        };

        const updatedReviews = [newReview, ...reviews];
        setReviews(updatedReviews);

        // Update stats
        const newTotalReviews = stats.totalReviews + 1;
        const newDistribution = { ...stats.ratingDistribution };
        newDistribution[ratingInput] = (newDistribution[ratingInput] || 0) + 1;
        const totalScore = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAvg = Number((totalScore / newTotalReviews).toFixed(1));

        setStats({
          ...stats,
          totalReviews: newTotalReviews,
          ratingDistribution: newDistribution,
          averageRating: newAvg,
        });

        // Reset form & close modal
        setReviewerName("");
        setCommentInput("");
        setRatingInput(5);
        setShowReviewModal(false);
      } else {
        toast.error(res.error || "Gagal mengirim ulasan.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHelpful = (id: string) => {
    setHelpfulMap((prev) => {
      const isHelpful = !prev[id];
      if (isHelpful) toast.success("Terima kasih atas tanggapan Anda!");
      return { ...prev, [id]: isHelpful };
    });
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Notice / Pengumuman Resmi Rilis */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-indigo-950 text-sm sm:text-base">Pemberitahuan Rilis Resmi</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">v1.0.0</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">APK Siap Pasang</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-relaxed">
              Aplikasi mobile Android resmi SDN 231 Sukaasih kini telah tersedia! Unduh secara mandiri tanpa perlu login, lengkap dengan fitur Scan QR & Wajah AI.
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadClick}
          className="shrink-0 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Unduh Sekarang
        </button>
      </div>

      {/* Main Play Store Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-8 flex flex-col gap-8">
        {/* Header App Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 shadow-xl shadow-indigo-500/10 border border-gray-100 flex items-center justify-center overflow-hidden">
              <img
                src="/icon.svg"
                alt="Logo Absensi SDN 231"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Absensi SDN 231 Sukaasih
            </h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-sm font-bold text-indigo-600">SDN 231 Sukaasih</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-gray-500">Pendidikan & Presensi</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Bebas Iklan</span>
            </div>

            {/* Play Store Stats Badges Row */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 font-black text-gray-900 text-sm sm:text-base">
                  <span>{stats.averageRating}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{stats.totalReviews} ulasan</span>
              </div>

              <div className="flex flex-col items-center border-l border-gray-100">
                <span className="font-black text-gray-900 text-sm sm:text-base">{stats.totalDownloads}+</span>
                <span className="text-[11px] text-gray-400 font-medium">Unduhan</span>
              </div>

              <div className="flex flex-col items-center border-l border-gray-100">
                <span className="font-black text-gray-900 text-sm sm:text-base">13.2 MB</span>
                <span className="text-[11px] text-gray-400 font-medium">Ukuran APK</span>
              </div>

              <div className="flex flex-col items-center border-l border-gray-100">
                <span className="font-black text-gray-900 text-sm sm:text-base">Semua</span>
                <span className="text-[11px] text-gray-400 font-medium">Rating 3+</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 text-base sm:text-lg transition-all"
          >
            <Download className={`w-6 h-6 ${isDownloading ? "animate-bounce" : ""}`} />
            <span>{isDownloading ? "Mengunduh File..." : "Download APK Langsung"}</span>
            <span className="text-xs bg-emerald-800/40 text-emerald-100 px-2 py-0.5 rounded-lg">13.2 MB</span>
          </button>

          <button
            onClick={() => setShowDriveModal(true)}
            className="py-4 px-5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl border border-gray-200 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Link Cadangan (Drive)</span>
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            className="py-4 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl border border-indigo-200/50 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Beri Rating</span>
          </button>
        </div>

        {/* Compatibility and Security Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Diverifikasi aman oleh Play Protect & Antivirus (Bebas Malware)</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Membutuhkan Android 8.0 (Oreo) atau versi lebih baru</span>
          </div>
        </div>

        {/* Feature Highlights Cards */}
        <div className="flex flex-col gap-3">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <span>✨ Fitur Unggulan Aplikasi</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Scan Wajah AI & QR</h4>
                <p className="text-xs text-gray-500 mt-0.5">Presensi kilat akurat hitungan detik dengan kamera native.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">KTA Digital Siswa</h4>
                <p className="text-xs text-gray-500 mt-0.5">Kartu tanda anggota digital interaktif lengkap QR NISN.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Gamifikasi & Level</h4>
                <p className="text-xs text-gray-500 mt-0.5">Kumpulkan XP kehadiran, raih titel keren, dan toko avatar.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">AI TemanMu</h4>
                <p className="text-xs text-gray-500 mt-0.5">Tutor AI ramah anak siap menemani tanya jawab belajar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Step Installation Guide */}
        <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/70 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              Panduan Cepat Memasang APK di HP Android
            </h3>
            <span className="text-xs text-indigo-600 font-bold">3 Langkah Mudah</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">Unduh File APK</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Tekan tombol hijau Download APK di atas dan tunggu proses selesai.</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">Izinkan Pemasangan</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Jika muncul peringatan keamanan, pilih <em>Izinkan dari sumber ini</em>.</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">Buka & Beri Izin Kamera</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Buka aplikasi dan izinkan kamera untuk mengaktifkan scan wajah & QR.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating & User Reviews Section (Marketplace / Play Store Style) */}
        <div className="flex flex-col gap-6 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Rating & Ulasan Pengguna</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Masukan, arahan, dan saran dari guru, wali murid, dan siswa SDN 231 Sukaasih.
              </p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Tulis Masukan & Review
            </button>
          </div>

          {/* Rating Breakdown Overview */}
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-6 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-gray-900 tracking-tighter">{stats.averageRating}</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(stats.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 mt-1 font-semibold">{stats.totalReviews} total penilaian</span>
            </div>

            {/* Stars Bar Chart */}
            <div className="flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution[star] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-3 text-gray-600 font-bold">{star}</span>
                    <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-400 font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="flex flex-col gap-3">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm">
                Belum ada ulasan. Jadilah yang pertama memberikan masukan untuk aplikasi ini!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-primary-hover flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{rev.name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {rev.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            • {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleHelpful(rev.id)}
                      className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                        helpfulMap[rev.id]
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                      title="Apakah ulasan ini membantu?"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{helpfulMap[rev.id] ? "Bermanfaat" : "Membantu?"}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words pl-0 sm:pl-[52px]">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Tulis Ulasan / Rating */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[150] bg-gray-950/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Beri Rating & Masukan Aplikasi</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ulasan Anda sangat berharga untuk kemajuan SDN 231 Sukaasih.</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-5 flex flex-col gap-4">
              {/* Star Rating Picker */}
              <div className="flex flex-col items-center justify-center py-2 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-500 mb-1">Pilih Bintang Penilaian</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingInput(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || ratingInput)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-600 mt-1">
                  {ratingInput === 5
                    ? "Sangat Bagus (5 Bintang)"
                    : ratingInput === 4
                    ? "Bagus (4 Bintang)"
                    : ratingInput === 3
                    ? "Cukup (3 Bintang)"
                    : ratingInput === 2
                    ? "Kurang (2 Bintang)"
                    : "Perlu Perbaikan (1 Bintang)"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status / Peran</label>
                <select
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                >
                  <option value="Wali Murid">Wali Murid</option>
                  <option value="Guru">Guru / Tenaga Pengajar</option>
                  <option value="Siswa">Siswa SDN 231</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Masyarakat / Tamu">Masyarakat / Pengunjung</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Komentar, Saran & Arahan Perbaikan
                </label>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Tuliskan pengalaman Anda, masukan fitur yang diinginkan, atau saran perbaikan..."
                  required
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm resize-none"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block text-right">
                  {commentInput.length}/500 karakter
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-sm rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Mengirim..." : "Kirim Ulasan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Link Alternatif Google Drive */}
      {showDriveModal && (
        <div className="fixed inset-0 z-[150] bg-gray-950/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-600" />
                Link Cadangan Google Drive
              </h3>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Jika unduhan langsung mengalami gangguan jaringan, Anda dapat mengunduh salinan cadangan APK melalui Google Drive resmi sekolah kami.
            </p>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-900">
              <span>Nama File:</span>
              <span className="font-mono">Absensi-SDN231.apk</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/downloads/Absensi-SDN231.apk"
                download="Absensi-SDN231.apk"
                onClick={() => {
                  setShowDriveModal(false);
                  toast.success("Memulai unduhan langsung!");
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl text-center shadow-md transition-colors"
              >
                Unduh via Jalur Cepat (Direct Server)
              </a>
              <button
                onClick={() => {
                  setShowDriveModal(false);
                  toast("Tautan Google Drive sedang disiapkan oleh Administrator.", { icon: "ℹ️" });
                }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl text-center transition-colors"
              >
                Buka di Google Drive Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
