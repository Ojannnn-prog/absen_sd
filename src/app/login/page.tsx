"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Memeriksa kredensial...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login berhasil! Selamat datang.", { id: toastId });
        
        // Use full reload for absolute state clear
        window.location.href = data.role === "admin" ? "/admin" : data.role === "teacher" ? "/teacher" : "/student";
      } else {
        toast.error(data.error || "Login gagal", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="card-soft p-8 w-full max-w-md relative">
        <Link 
          href="/" 
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[var(--theme-primary,var(--color-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Beranda
        </Link>
        
        <div className="text-center mb-8 mt-6">
          <div className="w-12 h-12 rounded-full bg-[var(--theme-primary,var(--color-primary))]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[var(--theme-primary,var(--color-primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Login Sistem</h1>
          <p className="text-sm text-gray-500 mt-2">Masuk sebagai Admin atau Siswa</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))]/20 focus:border-[var(--theme-primary,var(--color-primary))] transition-all sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))]/20 focus:border-[var(--theme-primary,var(--color-primary))] transition-all sm:text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 text-white font-bold w-full flex justify-center py-3 mt-4 rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
