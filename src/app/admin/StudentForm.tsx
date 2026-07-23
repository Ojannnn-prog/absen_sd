"use client";

import { useState } from "react";
import { createStudent } from "./actions";
import { UserPlus, X, CheckCircle2, CalendarDays, MapPin, Copy } from "lucide-react";

import CityInput from "@/components/CityInput";

import toast from "react-hot-toast";

export default function StudentForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [gender, setGender] = useState<"L" | "P" | "">("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!gender) {
      toast.error("Pilih jenis kelamin terlebih dahulu");
      return;
    }

    const form = e.currentTarget;
    setLoading(true);
    setResult(null);
    const toastId = toast.loading("Menyimpan data siswa...");
    
    const formData = new FormData(form);
    formData.append("gender", gender); // Append state based gender
    
    try {
      const res = await createStudent(formData);
      if (res.success) {
        setResult(res);
        form.reset();
        setGender("");
        toast.success("Siswa berhasil ditambahkan!", { id: toastId });
      } else {
        toast.error(res.message || "Gagal menyimpan data", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setResult(null);
    setGender("");
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md shadow-primary/20"
      >
        <UserPlus className="w-5 h-5" />
        Tambah Siswa Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-text-header flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Tambah Data Siswa
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {!result ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                    <input type="text" name="name" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Contoh: Budi Santoso" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tempat Lahir</label>
                      <CityInput />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Lahir</label>
                      <div className="relative">
                        <input type="date" name="birthDate" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-700" />
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

                  <div className="pt-2">
                    <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center py-3 text-base">
                      {loading ? "Menyimpan Data..." : "Simpan Data Siswa"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h3>
                  <p className="text-gray-500 mb-6 text-sm">Data siswa telah tersimpan ke dalam sistem.</p>
                  
                  <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-left">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm">Kode/Username</span>
                      <span className="font-bold text-gray-900">{result.username}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-gray-500 text-sm">Password Sementara</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary bg-indigo-50 px-2 py-1 rounded">{result.password}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(result.password);
                            toast.success("Password berhasil disalin!");
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-md transition-colors"
                          title="Salin Password"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-orange-500 mt-2 bg-orange-50 p-2 rounded flex gap-1 items-start">
                      <span className="font-bold">Penting:</span> Harap catat password ini karena tidak akan ditampilkan lagi.
                    </p>
                  </div>

                  <button onClick={closeModal} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-full transition-colors">
                    Tutup & Kembali
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
