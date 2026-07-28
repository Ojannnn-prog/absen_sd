"use client";

import { useState } from "react";
import { Users, Search, Plus, Trash2, Edit2, QrCode, ArrowLeft, Loader2, X, Eye, EyeOff, ShieldCheck, Download, FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import StudentQR from "@/components/StudentQR";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createStudentByTeacher, updateStudentByTeacher, deleteStudentByTeacher } from "./actions";

interface Props {
  teacher: any;
  initialStudents: any[];
}

export default function TeacherStudentClient({ teacher, initialStudents }: Props) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedQRStudent, setSelectedQRStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<"excel" | "pdf" | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [gender, setGender] = useState("L");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ username?: string; password?: string; studentCode?: string } | null>(null);

  const classGroup = teacher.classGroup || "A";

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.studentCode.includes(search)
  );

  const handleOpenEdit = (student: any) => {
    setSelectedStudent(student);
    setName(student.name || "");
    setGender(student.gender || "L");
    setBirthPlace(student.birthPlace || "");
    if (student.birthDate) {
      const d = new Date(student.birthDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setBirthDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setBirthDate("");
    }
    setPassword("");
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("gender", gender);
    formData.append("birthPlace", birthPlace.trim());
    formData.append("birthDate", birthDate);

    try {
      const res = await createStudentByTeacher(formData);
      if (res.success) {
        toast.success("Siswa berhasil ditambahkan!");
        setNewCredentials({
          username: res.username,
          password: res.password,
          studentCode: res.studentCode
        });
        setName("");
        setBirthPlace("");
        setBirthDate("");
        // Reload page to reflect data
        window.location.reload();
      } else {
        toast.error(res.message || "Gagal menambahkan siswa");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !name.trim()) return;

    setLoading(true);
    try {
      const parsedDate = birthDate ? new Date(birthDate) : null;
      const res = await updateStudentByTeacher(selectedStudent.id, {
        name: name.trim(),
        gender,
        birthPlace: birthPlace.trim(),
        birthDate: parsedDate,
        password: password ? password : undefined
      });

      if (res.success) {
        toast.success("Data siswa berhasil disimpan!");
        setIsEditOpen(false);
        window.location.reload();
      } else {
        toast.error(res.message || "Gagal mengubah data siswa");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, sName: string) => {
    if (!confirm(`Hapus siswa "${sName}" dari Kelas 6${classGroup}? Semua data absensinya akan terhapus.`)) return;

    const toastId = toast.loading("Menghapus siswa...");
    try {
      const res = await deleteStudentByTeacher(id);
      if (res.success) {
        toast.success("Siswa berhasil dihapus", { id: toastId });
        setStudents(students.filter(s => s.id !== id));
      } else {
        toast.error(res.message || "Gagal menghapus siswa", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    }
  };

  const exportExcel = () => {
    setExportLoading("excel");
    try {
      const data = filteredStudents.map((s, i) => {
        let hadir = 0;
        let izin = 0;
        let absen = 0;
        s.attendances?.forEach((a: any) => {
          if (a.status === "Hadir") hadir++;
          else if (a.status === "Izin") izin++;
          else absen++;
        });

        return {
          No: i + 1,
          "Nama Siswa": s.name,
          "L/P": s.gender,
          "NIS": s.studentCode,
          "Kelas": `6${classGroup}`,
          "Tempat Lahir": s.birthPlace || "-",
          "Tanggal Lahir": s.birthDate ? new Date(s.birthDate).toLocaleDateString("id-ID") : "-",
          "Hadir": hadir,
          "Izin": izin,
          "Absen/Alpha": absen,
          "Total Catatan": s.attendances?.length || 0
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Kelas 6${classGroup}`);
      XLSX.writeFile(wb, `Laporan_Siswa_Kelas_6${classGroup}_SDN231.xlsx`);
      toast.success("Excel berhasil diunduh");
    } catch (err) {
      toast.error("Gagal mendownload Excel");
    } finally {
      setExportLoading(null);
    }
  };

  const exportPDF = () => {
    setExportLoading("pdf");
    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(18);
      doc.text(`Laporan Kehadiran Siswa SDN 231 Sukaasih (Kelas 6${classGroup})`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Wali Kelas: ${teacher.name || "Guru"} | Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

      const rows = filteredStudents.map((s, i) => {
        let hadir = 0;
        let izin = 0;
        let absen = 0;
        s.attendances?.forEach((a: any) => {
          if (a.status === "Hadir") hadir++;
          else if (a.status === "Izin") izin++;
          else absen++;
        });

        return [
          (i + 1).toString(),
          s.name,
          s.studentCode,
          s.gender,
          `6${classGroup}`,
          hadir.toString(),
          izin.toString(),
          absen.toString()
        ];
      });

      autoTable(doc, {
        head: [['No', 'Nama Siswa', 'NIS', 'L/P', 'Kelas', 'Hadir', 'Izin', 'Absen']],
        body: rows,
        startY: 36,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`Laporan_Siswa_Kelas_6${classGroup}_SDN231.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      toast.error("Gagal mendownload PDF");
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              Kelola Siswa Kelas 6{classGroup}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Wali Kelas: {teacher.name || "Guru"} (Isolasi khusus Kelas 6{classGroup})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={exportLoading !== null}
            className="btn bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (6{classGroup})</span>
          </button>
          <button
            onClick={exportPDF}
            disabled={exportLoading !== null}
            className="btn bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>PDF (6{classGroup})</span>
          </button>
          <button
            onClick={() => {
              setNewCredentials(null);
              setName("");
              setBirthPlace("");
              setBirthDate("");
              setIsAddOpen(true);
            }}
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa (6{classGroup})</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-soft p-4 bg-white border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari nama atau NIS siswa di Kelas 6${classGroup}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
          Total Siswa Kelas 6{classGroup}: {filteredStudents.length} Siswa
        </div>
      </div>

      {/* Table */}
      <div className="card-soft overflow-hidden bg-white border border-gray-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6">No</th>
                <th className="py-4 px-6">Nama Siswa</th>
                <th className="py-4 px-6">NIS / Username</th>
                <th className="py-4 px-6">L/P</th>
                <th className="py-4 px-6">Tempat, Tgl Lahir</th>
                <th className="py-4 px-6 text-center">Kehadiran</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-400">{idx + 1}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{s.name}</td>
                  <td className="py-4 px-6 font-semibold text-gray-600">{s.studentCode}</td>
                  <td className="py-4 px-6 font-bold text-gray-700">{s.gender}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {s.birthPlace || "-"}{s.birthDate ? `, ${new Date(s.birthDate).toLocaleDateString("id-ID")}` : ""}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                      {s.attendances?.length || 0} Kali
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedQRStudent(s)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                        title="Lihat QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors"
                        title="Edit Siswa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Tidak ada data siswa ditemukan di Kelas 6{classGroup}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Student */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tambah Siswa Kelas 6{classGroup}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newCredentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-900">
                  <p className="font-bold text-sm mb-1">Akun Siswa Berhasil Dibuat!</p>
                  <p className="text-xs">Berikan info login di bawah ini kepada siswa:</p>
                  <div className="mt-3 space-y-1 bg-white p-3 rounded-lg border border-green-100 font-mono text-sm">
                    <div><strong>NIS / Username:</strong> {newCredentials.username}</div>
                    <div><strong>Password:</strong> {newCredentials.password}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewCredentials(null);
                  }}
                  className="w-full btn-primary bg-indigo-600 py-3 rounded-xl font-bold"
                >
                  Tutup & Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="Nama siswa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Kelas</label>
                    <input
                      type="text"
                      disabled
                      value={`Kelas 6${classGroup}`}
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                      placeholder="Bandung"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Simpan Siswa
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {isEditOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Edit Siswa (Kelas 6{classGroup})
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    disabled
                    value={`Kelas 6${classGroup}`}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reset Password Baru (Opsional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  placeholder="Kosongkan jika tidak ubah password"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQRStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col items-center relative">
            <button
              onClick={() => setSelectedQRStudent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-gray-900 mb-1">QR Code Siswa</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedQRStudent.name} ({selectedQRStudent.studentCode})</p>
            <StudentQR
              studentCode={selectedQRStudent.studentCode}
              name={selectedQRStudent.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
