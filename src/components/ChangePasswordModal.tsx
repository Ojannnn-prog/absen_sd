"use client";

import { useState } from "react";
import { Lock, X, KeyRound, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateStudentPassword } from "@/app/student/actions";

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast.error("Password minimal 4 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await updateStudentPassword(newPassword);
      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        setNewPassword("");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm"
      >
        <KeyRound className="w-5 h-5 text-gray-500" />
        Ubah Password
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Ubah Password Baru
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all font-medium"
                    placeholder="Masukkan password baru..."
                    required
                    minLength={4}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Buatlah password yang mudah diingat.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 4}
                  className="flex-1 flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
