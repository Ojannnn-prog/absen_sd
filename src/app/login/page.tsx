"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, ArrowLeft, Link2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSignIn, useSignUp, useUser, useClerk } from "@clerk/nextjs";
import { checkClerkLinkingStatus, linkSchoolAccountWithClerk } from "./clerkActions";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: isClerkLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();
  const { signOut, openSignIn } = useClerk();

  // Local Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // One-Time Linking Modal State (Skenario A)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUsername, setLinkUsername] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkShowPassword, setLinkShowPassword] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  // Pantau status login Clerk jika user baru saja login via Google/GitHub/TikTok
  useEffect(() => {
    if (!isUserLoaded) return;

    async function handleClerkSession() {
      if (isSignedIn) {
        setOauthLoading("verifying");
        const status = await checkClerkLinkingStatus();

        if (status.isLinked) {
          toast.success(`Selamat datang kembali, ${status.name || "Pengguna"}!`);
          const targetUrl = status.role === "admin" ? "/admin" : status.role === "teacher" ? "/teacher" : "/student";
          window.location.href = targetUrl;
        } else {
          // Akun belum tertaut ke profil sekolah -> Buka dialog penautan
          setOauthLoading(null);
          setShowLinkModal(true);
        }
      }
    }

    handleClerkSession();
  }, [isUserLoaded, isSignedIn]);

  // Login dengan Kredensial Sekolah (Bawaan)
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
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Login dengan OAuth Clerk (Google, GitHub, TikTok)
  const handleOAuthLogin = async (strategy: "oauth_google" | "oauth_github" | "oauth_tiktok") => {
    setOauthLoading(strategy);
    try {
      // 1. Coba signIn.sso() (Clerk v7+ Core 3 API standar)
      if (signIn && typeof (signIn as any).sso === "function") {
        try {
          await (signIn as any).sso({
            strategy,
            redirectCallbackUrl: "/sso-callback",
            redirectUrl: "/login",
          });
          return;
        } catch (ssoErr: any) {
          // Jika akun baru memerlukan pendaftaran melalui signUp.sso()
          if (signUp && typeof (signUp as any).sso === "function") {
            await (signUp as any).sso({
              strategy,
              redirectCallbackUrl: "/sso-callback",
              redirectUrl: "/login",
            });
            return;
          }
          throw ssoErr;
        }
      }

      // 2. Coba signIn.authenticateWithRedirect() jika didukung versi SDK
      if (signIn && typeof (signIn as any).authenticateWithRedirect === "function") {
        await (signIn as any).authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/login",
        });
        return;
      }

      // 3. Fallback: Buka modal dialog resmi Clerk
      if (openSignIn) {
        openSignIn({
          fallbackRedirectUrl: "/login",
          signUpFallbackRedirectUrl: "/login",
        });
        setOauthLoading(null);
        return;
      }
    } catch (err: any) {
      setOauthLoading(null);
      console.error(`Clerk ${strategy} Login Error:`, err);
      toast.error(err.errors?.[0]?.message || err.message || `Gagal membuka login ${strategy}`);
    }
  };

  // Submit Penautan Akun Sekolah ke Pihak Ketiga (One-Time Link)
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUsername || !linkPassword) {
      toast.error("Username/NIS dan Password sekolah wajib diisi!");
      return;
    }

    setLinkLoading(true);
    const toastId = toast.loading("Menautkan akun sekolah...");

    try {
      const res = await linkSchoolAccountWithClerk(linkUsername, linkPassword);

      if (res.success) {
        toast.success(res.message, { id: toastId });
        setShowLinkModal(false);
        const targetUrl = res.role === "admin" ? "/admin" : res.role === "teacher" ? "/teacher" : "/student";
        window.location.href = targetUrl;
      } else {
        toast.error(res.message || "Gagal menautkan akun sekolah.", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat menautkan akun.", { id: toastId });
    } finally {
      setLinkLoading(false);
    }
  };

  // Batal Penautan (Sign Out)
  const handleCancelLink = async () => {
    setShowLinkModal(false);
    await signOut();
    toast("Penautan dibatalkan.");
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

        {/* Tombol Login Pihak Ketiga (OAuth Clerk: Google, GitHub, TikTok) */}
        <div className="flex flex-col gap-2.5 mb-5">
          {/* Tombol Google */}
          <button
            type="button"
            onClick={() => handleOAuthLogin("oauth_google")}
            disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm transition-all hover:border-gray-300 disabled:opacity-60 cursor-pointer"
          >
            {oauthLoading === "oauth_google" ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{oauthLoading === "oauth_google" ? "Menghubungkan Google..." : "Masuk dengan Google"}</span>
          </button>

          {/* Tombol GitHub & TikTok */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tombol GitHub */}
            <button
              type="button"
              onClick={() => handleOAuthLogin("oauth_github")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs shadow-sm transition-all hover:border-gray-300 disabled:opacity-60 cursor-pointer"
            >
              {oauthLoading === "oauth_github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
              ) : (
                <svg className="w-4 h-4 fill-current text-gray-900" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              )}
              <span>{oauthLoading === "oauth_github" ? "Menghubungkan..." : "Masuk GitHub"}</span>
            </button>

            {/* Tombol TikTok */}
            <button
              type="button"
              onClick={() => handleOAuthLogin("oauth_tiktok")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs shadow-sm transition-all hover:border-gray-300 disabled:opacity-60 cursor-pointer"
            >
              {oauthLoading === "oauth_tiktok" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-800" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#000000" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-1-.09z"/>
                </svg>
              )}
              <span>{oauthLoading === "oauth_tiktok" ? "Menghubungkan..." : "Masuk TikTok"}</span>
            </button>
          </div>
        </div>

        {/* Pemisah Garis */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            atau gunakan akun sekolah
          </span>
          <div className="border-t border-gray-200 w-full"></div>
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

      {/* Modal Dialog One-Time Linking (Skenario A) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Tautkan Akun Sekolah</h3>
                  <p className="text-xs text-indigo-100 font-medium">Penautan aman sekali pakai (One-Time Link)</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-start gap-3 text-xs text-indigo-900">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Akun Anda Terverifikasi:</p>
                  <p className="font-mono text-indigo-700 mt-0.5 font-bold">
                    {user?.emailAddresses?.[0]?.emailAddress || user?.username || "Akun OAuth"}
                  </p>
                  <p className="text-gray-500 mt-1">
                    Masukkan Username/NIS dan Password sekolah Anda untuk mengonfirmasi kepemilikan akun.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Username / NIS Sekolah
                  </label>
                  <input
                    type="text"
                    value={linkUsername}
                    onChange={(e) => setLinkUsername(e.target.value)}
                    required
                    placeholder="Contoh: 2312026001 atau guru6a"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Password Sekolah
                  </label>
                  <div className="relative">
                    <input
                      type={linkShowPassword ? "text" : "password"}
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      required
                      placeholder="Masukkan kata sandi akun sekolah"
                      className="w-full px-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setLinkShowPassword(!linkShowPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {linkShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelLink}
                    disabled={linkLoading}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={linkLoading}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    <span>Tautkan & Masuk</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
