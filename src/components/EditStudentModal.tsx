"use client";

import { useState } from "react";
import { X, CheckCircle2, MapPin, KeyRound, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { updateStudent } from "@/app/admin/actions";
import CityInput from "./CityInput";

export default function EditStudentModal({ 
  student, 
  onClose 
}: { 
  student: any, 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"L" | "P">(student.gender as "L" | "P");
  const [useApiRegion, setUseApiRegion] = useState(false);

  // Parse existing date for default value (YYYY-MM-DD)
  const defaultDate = student.birthDate 
    ? new Date(student.birthDate).toISOString().split('T')[0] 
    : "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan pembaruan...");
    
    const formData = new FormData(e.currentTarget);
    formData.append("gender", gender);
    
    try {
      await updateStudent(student.id, formData);
      toast.success("Data siswa berhasil diperbarui!", { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui data", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-text-header flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Data Siswa
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
              <input type="text" name="name" defaultValue={student.name} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                <CityInput defaultValue={student.birthPlace || ""} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                <div className="relative">
                  <input type="date" name="birthDate" defaultValue={defaultDate} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-700" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reset Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="newPassword" placeholder="Kosongkan jika tidak diubah" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setGender("L")}
                  className={`cursor-pointer border-2 rounded-xl p-3 flex items-center justify-between transition-all ${
                    gender === "L" ? "border-primary bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className={`font-medium ${gender === "L" ? "text-primary" : "text-gray-600"}`}>Laki-laki</span>
                  {gender === "L" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
                
                <div 
                  onClick={() => setGender("P")}
                  className={`cursor-pointer border-2 rounded-xl p-3 flex items-center justify-between transition-all ${
                    gender === "P" ? "border-pink-500 bg-pink-50" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className={`font-medium ${gender === "P" ? "text-pink-600" : "text-gray-600"}`}>Perempuan</span>
                  {gender === "P" && <CheckCircle2 className="w-5 h-5 text-pink-500" />}
                </div>
              </div>
            </div>

            <div className="pt-2 mt-auto">
              <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center py-3 text-base">
                {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
