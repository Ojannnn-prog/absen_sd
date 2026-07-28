"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X, Home, BookOpen, Users, AlertTriangle, GraduationCap, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import ActivePing from "./ActivePing";

export default function Navbar({ role }: { role: string | null }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  const executeLogout = async () => {
    setShowLogoutModal(false);
    toast.loading("Proses logout...", { id: "logout" });
    
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logout berhasil! Sampai jumpa.", { id: "logout" });
      
      // Force a full page reload to clear all Next.js client-side cache and states
      window.location.href = "/login";
    } catch (err) {
      toast.error("Gagal logout.", { id: "logout" });
    }
  };

  const NavLinks = () => {
    if (role === "admin") {
      return (
        <>
          <a href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <Home className="w-5 h-5" /> Dasbor
          </a>
          <a href="/admin/student" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <Users className="w-5 h-5" /> Kelola Siswa
          </a>
          <a href="/admin/teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <GraduationCap className="w-5 h-5 text-indigo-600" /> Kelola Guru
          </a>
          <a href="/admin/resources" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <BookOpen className="w-5 h-5" /> Sumber Belajar
          </a>
        </>
      );
    }

    if (role === "teacher") {
      return (
        <>
          <ActivePing />
          <a href="/teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <Home className="w-5 h-5" /> Dasbor Guru
          </a>
          <a href="/teacher/student" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <Users className="w-5 h-5 text-primary" /> Kelola Siswa
          </a>
          <a href="/teacher/scanner" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <QrCode className="w-5 h-5 text-indigo-600" /> Scanner Kelas
          </a>
        </>
      );
    }

    if (role === "student") {
      return (
        <>
          <ActivePing />
          <a href="/student" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium transition-colors">
            <Home className="w-5 h-5" /> Profil & Absensi
          </a>
          <a href="/student/course" onClick={() => setIsOpen(false)} className="flex items-center gap-2 py-2 px-4 rounded-xl hover:bg-[var(--theme-primary,var(--color-primary))]/10 hover:text-[var(--theme-primary,var(--color-primary))] text-gray-700 font-bold transition-colors">
            <BookOpen className="w-5 h-5 text-[var(--theme-primary,var(--color-primary))]" /> Ruang Belajar
          </a>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <nav className="flex items-center gap-2 md:gap-4">
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 mr-4">
          {role && <NavLinks />}
        </div>

        {role ? (
          <>
            {/* Desktop Logout Button */}
            <button 
              onClick={handleLogoutClick}
              className="hidden md:flex text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-full transition-colors items-center gap-2 border border-red-100"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
            
            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </>
        ) : (
          <a 
            href="/login"
            className="text-sm font-medium text-text-body hover:text-primary transition-colors flex items-center gap-1"
          >
            Login
          </a>
        )}
      </nav>

      {/* Mobile Dropdown Menu (Overlay) */}
      {isOpen && role && (
        <div className="absolute top-full left-0 w-full bg-white shadow-xl border-b border-gray-100 md:hidden animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="flex flex-col p-4 gap-2">
            <NavLinks />
            <div className="h-px bg-gray-100 my-2 w-full"></div>
            <button 
              onClick={handleLogoutClick}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-red-50 text-red-600 font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
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
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
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
