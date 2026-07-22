"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLoginClick = (e: React.MouseEvent) => {
    if (isLoggedIn) {
      e.preventDefault();
      toast.error("Anda sudah login! Silakan logout terlebih dahulu.", {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const executeLogout = async () => {
    setShowLogoutModal(false);
    toast.loading("Proses logout...", { id: "logout" });
    
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logout berhasil! Sampai jumpa.", { id: "logout" });
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Gagal logout.", { id: "logout" });
    }
  };

  return (
    <>
      <nav className="flex items-center gap-4">
        <a 
          href="/login" 
          onClick={handleLoginClick}
          className="text-sm font-medium text-text-body hover:text-primary transition-colors flex items-center gap-1"
        >
          <LogIn className="w-4 h-4" />
          Login
        </a>
        
        {isLoggedIn && (
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </nav>

      {/* Modern Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
              <p className="text-gray-500 text-sm mb-6">
                Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk mengakses Dashboard.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeLogout}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/30"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
