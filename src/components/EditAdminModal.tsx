"use client";

import { useState } from "react";
import { X, KeyRound, User, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { updateAdmin } from "@/app/admin/actions";

export default function EditAdminModal({ 
  admin, 
  onClose 
}: { 
  admin: { id: string, username: string, name?: string | null }, 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan pembaruan admin...");
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateAdmin(admin.id, formData);
      toast.success("Profil Admin berhasil diperbarui!", { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-text-header flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Pengaturan Admin
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Tampilan</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={admin.name || ""} 
                  placeholder="Contoh: Bpk. Guru Budi" 
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ubah Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  name="newPassword" 
                  placeholder="Kosongkan jika tidak diubah" 
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Password akan otomatis dienkripsi oleh sistem.</p>
            </div>
            
            <div className="pt-4 mt-2">
              <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center py-3 text-base">
                {loading ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
