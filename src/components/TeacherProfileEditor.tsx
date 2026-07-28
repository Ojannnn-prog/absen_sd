"use client";

import { useState } from "react";
import { User, Key, Save, Crown, Palette, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateTeacherProfile } from "@/app/teacher/actions";
import { useRouter } from "next/navigation";

const ALL_THEMES = [
  { id: "default", label: "Default Indigo", color: "bg-indigo-600" },
  { id: "galaxy", label: "Galaxy Neon", color: "bg-purple-600" },
  { id: "sunset", label: "Sunset Orange", color: "bg-orange-500" },
  { id: "forest", label: "Forest Green", color: "bg-emerald-600" },
  { id: "emerald", label: "Royal Gold", color: "bg-amber-600" },
];

const ALL_TITLES = [
  "Guru Kelas 6",
  "Wali Kelas Ahli",
  "Master KKA",
  "Sang Penakluk",
  "Mentor Inspiratif",
  "Pendidik Unggul"
];

interface Props {
  teacher: any;
}

export default function TeacherProfileEditor({ teacher }: Props) {
  const router = useRouter();
  const [name, setName] = useState(teacher.name || "");
  const [nickname, setNickname] = useState(teacher.nickname || "");
  const [password, setPassword] = useState("");
  const [activeTheme, setActiveTheme] = useState(teacher.activeTheme || "default");
  const [activeTitle, setActiveTitle] = useState(teacher.activeTitle || "Guru Kelas 6");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const res = await updateTeacherProfile({
        name,
        nickname,
        password: password ? password : undefined,
        activeTheme,
        activeTitle
      });

      if (res.success) {
        toast.success("Profil Guru berhasil diperbarui!");
        setPassword("");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menyimpan perubahan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card-soft p-6 md:p-8 bg-white border border-gray-100 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            Pengaturan Akun & Profil Guru
          </h2>
          <p className="text-xs text-gray-500 mt-1">Sesuaikan nama, gelar khusus, tema dasbor, dan sandi Anda</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
          <Crown className="w-3.5 h-3.5" />
          Akses Premium
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Guru</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Contoh: Siti Rahmawati, S.Pd."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Gelar / Nickname Khusus</label>
          <input 
            type="text" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Contoh: Guru Kelas 6A / Master KKA"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Pilih Titel Eksklusif Guru
          </label>
          <select 
            value={activeTitle}
            onChange={(e) => setActiveTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
          >
            {ALL_TITLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-500" />
            Pilih Tema Dasbor
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setActiveTheme(th.id)}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTheme === th.id
                    ? "ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${th.color}`} />
                {th.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-500" />
          Ubah Password (Opsional)
        </label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          placeholder="Kosongkan jika tidak ingin mengubah password"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Profil Guru
        </button>
      </div>
    </form>
  );
}
