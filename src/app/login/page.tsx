"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
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
        window.location.href = data.role === "admin" ? "/admin" : data.role === "teacher" ? "/teacher" : "/student";
      } else {
        if (typeof data.cooldownSeconds === "number" && data.cooldownSeconds > 0) {
          setCooldownSeconds(data.cooldownSeconds);
        }
        const attemptHint =
          data.cooldownSeconds === 0 && typeof data.initialAttemptsRemaining === "number"
            ? ` Sisa kesempatan sebelum cooldown: ${data.initialAttemptsRemaining}.`
            : "";
        toast.error(`${data.error || "Login gagal"}${attemptHint}`, { id: toastId });
      }
    } catch {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="card-soft p-8 w-full max-w-md relative bg-white/80 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl">
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[var(--theme-primary,var(--color-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Beranda
        </Link>

        <div className="text-center mb-6 mt-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary,var(--color-primary))]/10 text-[var(--theme-primary,var(--color-primary))] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Login Portal Sekolah</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Sistem Absensi & Pembelajaran SDN 231 Sukaasih</p>
        </div>

        {/* Form Login Kredensial Sekolah (Username/NIS & Password) */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Username atau NIS Siswa
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || cooldownSeconds > 0}
                required
                placeholder="Contoh: 2312026001 atau guru6a"
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || cooldownSeconds > 0}
                required
                placeholder="Masukkan kata sandi"
                className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {cooldownSeconds > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-800">
              Percobaan login ditahan. Silakan tunggu <strong>{cooldownSeconds} detik</strong>.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full flex justify-center py-3 mt-2 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-70 cursor-pointer"
          >
            {cooldownSeconds > 0 ? `Tunggu ${cooldownSeconds}s` : loading ? "Memproses..." : "Masuk Sistem"}
          </button>
        </form>
      </div>
    </div>
  );
}
