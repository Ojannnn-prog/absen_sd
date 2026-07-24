"use client";

import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
      <div className="relative flex flex-col items-center justify-center p-8 bg-white shadow-2xl rounded-3xl border border-blue-100">
        <div className="absolute inset-0 bg-blue-50/50 rounded-3xl animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
        <p className="mt-4 text-sm font-bold text-blue-800 tracking-widest uppercase relative z-10 animate-pulse">
          Memuat Data...
        </p>
      </div>
    </div>
  );
}
