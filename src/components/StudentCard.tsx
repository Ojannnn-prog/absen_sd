"use client";

import { useState } from "react";
import StudentQR from "@/components/StudentQR";
import EditStudentModal from "./EditStudentModal";
import { Edit2, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { deleteStudent } from "@/app/admin/actions";

export default function StudentCard({ student }: { student: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Menghapus data siswa...");
    try {
      await deleteStudent(student.id);
      toast.success("Siswa berhasil dihapus", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus siswa", { id: toastId });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4 relative overflow-hidden group">
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="p-2 bg-gray-50 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors"
            title="Edit Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Hapus Siswa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-full flex justify-between items-start mb-2 pr-16">
          <div className="text-left flex flex-col items-start">
            <p className="font-bold text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 w-fit">{student.studentCode}</p>
            {student.birthPlace && student.birthDate && (
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 text-left">
                {student.birthPlace}, {new Date(student.birthDate).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${student.gender === 'L' ? 'bg-indigo-100 text-primary' : 'bg-pink-100 text-pink-600'}`}>
            {student.gender}
          </div>
        </div>
        
        {/* Komponen QR Code Client-side */}
        <StudentQR studentCode={student.studentCode} name={student.name} />
      </div>

      {isEditOpen && (
        <EditStudentModal student={student} onClose={() => setIsEditOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Siswa?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Anda yakin ingin menghapus data <b>{student.name}</b>? Data riwayat absen siswa ini juga akan terhapus permanen.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 flex justify-center items-center"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
