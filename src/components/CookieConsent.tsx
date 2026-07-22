"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah pernah menyetujui cookie
    const hasConsented = localStorage.getItem("cookie_consent");
    if (!hasConsented) {
      // Delay sedikit agar animasinya terlihat setelah halaman dimuat
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="bg-primary/20 p-2.5 rounded-full shrink-0">
            <Cookie className="w-6 h-6 text-primary-light" />
          </div>
          <div>
            <h4 className="font-bold text-base mb-1">Penggunaan Cookie</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Kami menggunakan cookie untuk memastikan Anda mendapatkan pengalaman terbaik di website kami, termasuk untuk mengelola sesi login dan preferensi Anda. Dengan melanjutkan, Anda menyetujui kebijakan cookie kami.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
          <button 
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
          >
            Nanti
          </button>
          <button 
            onClick={handleAccept}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all w-full md:w-auto text-center"
          >
            Mengerti & Setuju
          </button>
        </div>
      </div>
    </div>
  );
}
