"use client";

import { useState } from "react";
import { updateStudent, deleteStudent } from "./actions";
import toast from "react-hot-toast";
import { Search, Edit2, Trash2, Download, Eye, EyeOff, Loader2, X, Save, User as UserIcon } from "lucide-react";
import QRCode from "qrcode";
import { getAvatarUrl } from "@/lib/avatar";
import AdminReportButton from "@/components/AdminReportButton";

export default function AdminStudentClient({ initialStudents }: { initialStudents: any[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  
  const getOnlineStatus = (lastActive: string | null) => {
    if (!lastActive) return { isOnline: false, text: "Belum pernah login" };
    
    const last = new Date(lastActive);
    const now = new Date();
    const diffMins = (now.getTime() - last.getTime()) / (1000 * 60);
    
    // Aktif dalam 5 menit terakhir = Online
    if (diffMins <= 5) {
      return { isOnline: true, text: "Online saat ini" };
    }
    
    return { 
      isOnline: false, 
      text: "Terakhir: " + last.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    };
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Password visibility tracking per row
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const downloadQR = async (studentCode: string, studentName: string) => {
    try {
      const qrUrl = await QRCode.toDataURL(studentCode, {
        width: 300,
        margin: 2,
        color: { dark: "#111827", light: "#FFFFFF" }
      });
      const a = document.createElement("a");
      a.href = qrUrl;
      a.download = `QR_${studentName}_${studentCode}.png`;
      a.click();
      toast.success("QR Code berhasil diunduh");
    } catch (error) {
      toast.error("Gagal men-generate QR Code");
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setName(student.name);
    setPassword(student.password);
    setGender(student.gender || "");
    setBirthPlace(student.birthPlace || "");
    setBirthDate(student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!name) {
      toast.error("Nama wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await updateStudent(editingStudent.id, {
        name,
        password: password !== editingStudent.password ? password : undefined,
        gender,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : null
      });

      if (res.success) {
        toast.success("Data siswa berhasil diperbarui");
        window.location.reload();
      } else {
        toast.error(res.message || "Gagal memperbarui data");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`Peringatan: Hapus data siswa ${studentName} beserta semua riwayat absen dan nilainya secara permanen?`)) return;
    
    toast.loading("Menghapus...", { id: "delete" });
    try {
      const res = await deleteStudent(id);
      if (res.success) {
        toast.success("Siswa berhasil dihapus", { id: "delete" });
        setStudents(students.filter(s => s.id !== id));
      } else {
        toast.error(res.message || "Gagal menghapus", { id: "delete" });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem", { id: "delete" });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.includes(search)
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Kelola Data Siswa</h1>
          <p className="text-gray-500 mt-1 font-medium">Manajemen data, password, dan QR Code siswa</p>
        </div>
        
        <div className="w-full flex-1 flex flex-col md:flex-row gap-4 items-center justify-end">
          <div className="w-full md:w-80 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama, username, atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))] outline-none font-medium text-gray-700"
            />
          </div>
          <AdminReportButton students={students} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-bold text-gray-600">Profil</th>
                <th className="py-4 px-6 font-bold text-gray-600">Gamifikasi</th>
                <th className="py-4 px-6 font-bold text-gray-600">Kata Sandi</th>
                <th className="py-4 px-6 font-bold text-gray-600">TTL & Gender</th>
                <th className="py-4 px-6 font-bold text-gray-600 text-center">Status Akses</th>
                <th className="py-4 px-6 font-bold text-gray-600 text-center">QR Code</th>
                <th className="py-4 px-6 font-bold text-gray-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                    {search ? "Pencarian tidak ditemukan." : "Belum ada data siswa."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPassVisible = visiblePasswords[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
                            <img src={getAvatarUrl(student.avatarConfig, student.profileImage, student.name, student.gender)} alt={student.name} className="w-full h-full object-cover bg-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{student.name}</div>
                            <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                              NIS: {student.studentCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-[var(--theme-primary,var(--color-primary))] bg-[var(--theme-primary,var(--color-primary))]/10 px-3 py-1 rounded-lg">
                          @{student.username}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 max-w-[150px]">
                          <span className="font-mono flex-1 text-sm text-gray-700 tracking-wider truncate">
                            {isPassVisible ? student.password : "••••••••"}
                          </span>
                          <button 
                            onClick={() => togglePassword(student.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title={isPassVisible ? "Sembunyikan Sandi" : "Lihat Sandi"}
                          >
                            {isPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">
                          {student.birthPlace || "-"}, {student.birthDate ? new Date(student.birthDate).toLocaleDateString('id-ID') : "-"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 uppercase font-bold">
                          {student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "-"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {(() => {
                          const status = getOnlineStatus(student.lastActive);
                          return (
                            <div className="flex flex-col items-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${status.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                {status.isOnline ? "Online" : "Offline"}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium mt-1 whitespace-nowrap text-center">
                                {status.text}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => downloadQR(student.studentCode, student.name)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-sm rounded-xl transition-colors"
                        >
                          <Download className="w-4 h-4" /> Unduh
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id, student.name)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Edit Data Siswa</h2>
                <p className="text-sm text-gray-500 font-medium">Ubah informasi personal siswa.</p>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar flex flex-col gap-5">
              
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-md flex items-center justify-center">
                  <img src={getAvatarUrl(editingStudent.avatarConfig, editingStudent.profileImage, editingStudent.name, editingStudent.gender)} alt={editingStudent.name} className="w-full h-full object-cover bg-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wide">Data Terkunci (Read-Only)</p>
                  <p className="font-medium text-gray-700 text-sm">Foto profil dan Username Gamifikasi (<span className="font-black text-gray-900">@{editingStudent.username}</span>) hanya dapat diubah oleh siswa melalui akun mereka sendiri demi menjaga keamanan akun dan gamifikasi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Asli <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))] focus:border-transparent outline-none font-medium text-gray-900 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kata Sandi Baru</label>
                  <input 
                    type="text" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))] focus:border-transparent outline-none font-medium text-gray-900 transition-all font-mono"
                    placeholder="Minimal 6 karakter"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah sandi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tempat Lahir</label>
                  <input 
                    type="text" 
                    value={birthPlace} 
                    onChange={e => setBirthPlace(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))] focus:border-transparent outline-none font-medium text-gray-900 transition-all"
                    placeholder="Cth: Bandung"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={birthDate} 
                    onChange={e => setBirthDate(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--theme-primary,var(--color-primary))] focus:border-transparent outline-none font-medium text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="L" 
                      checked={gender === "L"} 
                      onChange={e => setGender(e.target.value)} 
                      className="w-4 h-4 text-[var(--theme-primary,var(--color-primary))] focus:ring-[var(--theme-primary,var(--color-primary))]"
                    />
                    <span className="font-bold text-gray-700">Laki-Laki</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors w-full">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="P" 
                      checked={gender === "P"} 
                      onChange={e => setGender(e.target.value)} 
                      className="w-4 h-4 text-[var(--theme-primary,var(--color-primary))] focus:ring-[var(--theme-primary,var(--color-primary))]"
                    />
                    <span className="font-bold text-gray-700">Perempuan</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 font-bold text-white bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
