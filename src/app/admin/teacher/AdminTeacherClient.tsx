"use client";

import { useState } from "react";
import { createTeacher, updateTeacher, deleteTeacher } from "./actions";
import toast from "react-hot-toast";
import { Search, Edit2, Trash2, Eye, EyeOff, Loader2, X, Save, UserPlus, CheckCircle2, Copy, GraduationCap } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

export default function AdminTeacherClient({ initialTeachers }: { initialTeachers: any[] }) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");

  // Add modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addResult, setAddResult] = useState<any>(null);

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  // Form states for Add
  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addNip, setAddNip] = useState("");
  const [addClassGroup, setAddClassGroup] = useState("A");
  const [addPassword, setAddPassword] = useState("");

  // Form states for Edit
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editNip, setEditNip] = useState("");
  const [editClassGroup, setEditClassGroup] = useState("A");
  const [editPassword, setEditPassword] = useState("");

  // Password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addUsername) {
      toast.error("Nama dan Username wajib diisi");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("name", addName);
    formData.append("username", addUsername);
    formData.append("nip", addNip);
    formData.append("classGroup", addClassGroup);
    formData.append("password", addPassword);

    try {
      const res = await createTeacher(formData);
      if (res.success) {
        setAddResult(res);
        toast.success("Akun Guru berhasil dibuat!");
      } else {
        toast.error(res.message || "Gagal membuat akun guru");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
    setAddResult(null);
    setAddName("");
    setAddUsername("");
    setAddNip("");
    setAddClassGroup("A");
    setAddPassword("");
    if (addResult) {
      window.location.reload();
    }
  };

  const openEditModal = (t: any) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditUsername(t.username);
    setEditNip(t.nip || "");
    setEditClassGroup(t.classGroup || "A");
    setEditPassword("");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("name", editName);
    formData.append("username", editUsername);
    formData.append("nip", editNip);
    formData.append("classGroup", editClassGroup);
    formData.append("newPassword", editPassword);

    try {
      const res = await updateTeacher(editingTeacher.id, formData);
      if (res.success) {
        toast.success("Data guru berhasil diperbarui");
        window.location.reload();
      } else {
        toast.error(res.message || "Gagal memperbarui data");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus akun Guru "${name}" secara permanen?`)) return;
    toast.loading("Menghapus...", { id: "delete-teacher" });
    try {
      const res = await deleteTeacher(id);
      if (res.success) {
        toast.success("Guru berhasil dihapus", { id: "delete-teacher" });
        setTeachers(teachers.filter(t => t.id !== id));
      } else {
        toast.error("Gagal menghapus", { id: "delete-teacher" });
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem", { id: "delete-teacher" });
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.username.toLowerCase().includes(search.toLowerCase()) ||
      (t.nip && t.nip.includes(search));
    const matchesClass = classFilter === "ALL" || t.classGroup === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        {/* Class Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "Semua Kelas" },
            { id: "A", label: "Kelas 6A" },
            { id: "B", label: "Kelas 6B" },
            { id: "C", label: "Kelas 6C" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setClassFilter(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                classFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, username, NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700 text-sm"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 px-5 py-2.5 shadow-md shrink-0"
          >
            <UserPlus className="w-5 h-5" /> Tambah Guru Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 font-bold text-gray-600">Profil Guru</th>
                <th className="py-4 px-6 font-bold text-gray-600">Username</th>
                <th className="py-4 px-6 font-bold text-gray-600">Role & Kelas</th>
                <th className="py-4 px-6 font-bold text-gray-600">Kata Sandi</th>
                <th className="py-4 px-6 font-bold text-gray-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                    {search || classFilter !== "ALL" ? "Guru dengan filter tersebut tidak ditemukan." : "Belum ada data guru terdaftar."}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isPassVisible = visiblePasswords[t.id];
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
                            <img src={getAvatarUrl(t.avatarConfig, t.profileImage, t.name, "L")} alt={t.name} className="w-full h-full object-cover bg-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{t.name}</div>
                            <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                              {t.nip ? `NIP: ${t.nip}` : "Tanpa NIP"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                          @{t.username}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-extrabold bg-blue-100 text-blue-700">
                          <GraduationCap className="w-4 h-4" /> Kelas 6{t.classGroup || "A"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 max-w-[150px]">
                          <span className="font-mono flex-1 text-sm text-gray-700 tracking-wider truncate">
                            {isPassVisible ? t.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePassword(t.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title={isPassVisible ? "Sembunyikan Sandi" : "Lihat Sandi"}
                          >
                            {isPassVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Edit Guru"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.name)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Hapus Guru"
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

      {/* ADD TEACHER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Tambah Guru Pengampu
              </h2>
              <button onClick={closeAddModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {!addResult ? (
                <form onSubmit={handleAddSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      required
                      placeholder="Contoh: Ibu Rina Sukaesih, S.Pd."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Username Login <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={addUsername}
                        onChange={(e) => setAddUsername(e.target.value)}
                        required
                        placeholder="Contoh: gurukelas6a"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">NIP / Kode Guru</label>
                      <input
                        type="text"
                        value={addNip}
                        onChange={(e) => setAddNip(e.target.value)}
                        placeholder="Opsional"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kelas Pengampu (Role Akses) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {["A", "B", "C"].map((cls) => (
                        <button
                          type="button"
                          key={cls}
                          onClick={() => setAddClassGroup(cls)}
                          className={`py-3 px-4 rounded-xl font-bold text-center border-2 transition-all ${
                            addClassGroup === cls
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Kelas 6{cls}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kata Sandi Sementara</label>
                    <input
                      type="text"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="Kosongkan untuk auto-generate"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Jika dikosongkan, sistem membuatkan sandi acak 8 karakter.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Simpan Data Guru
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Akun Guru Berhasil Dibuat!</h3>
                  <p className="text-gray-500 mb-6 text-sm">Akun ini memiliki akses penuh ke Kelas 6{addResult.teacher.classGroup}.</p>

                  <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-left">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm">Username</span>
                      <span className="font-bold text-gray-900">@{addResult.teacher.username}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-500 text-sm">Kelas Pengampu</span>
                      <span className="font-bold text-indigo-600">Kelas 6{addResult.teacher.classGroup}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span className="text-gray-500 text-sm">Password Sementara</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{addResult.password}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(addResult.password);
                            toast.success("Password berhasil disalin!");
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Salin Password"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button onClick={closeAddModal} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-full transition-colors">
                    Tutup & Kembali
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {isEditOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-gray-900">Edit Akun Guru</h2>
              <button onClick={() => setIsEditOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username Login <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">NIP / Kode Guru</label>
                  <input
                    type="text"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kelas Pengampu (Role Akses) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {["A", "B", "C"].map((cls) => (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => setEditClassGroup(cls)}
                      className={`py-3 px-4 rounded-xl font-bold text-center border-2 transition-all ${
                        editClassGroup === cls
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Kelas 6{cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-gray-900"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-70"
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
