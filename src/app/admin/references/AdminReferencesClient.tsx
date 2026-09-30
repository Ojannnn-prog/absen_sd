"use client";

import { useState } from "react";
import { BookOpen, Edit2, Eye, FileAudio, FileImage, FileText, FileVideo, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { createTeacherReference, deleteTeacherReference, updateTeacherReference } from "./actions";

const FILE_TYPES = ["PDF", "Word", "Excel", "PowerPoint", "Gambar", "Video", "Audio", "Lainnya"];

type TeacherReference = {
  id: string;
  title: string;
  driveUrl: string;
  fileType: string;
};

function getTypeIcon(fileType: string) {
  if (fileType === "Video") return <FileVideo className="w-5 h-5 text-purple-600" />;
  if (fileType === "Audio") return <FileAudio className="w-5 h-5 text-amber-600" />;
  if (fileType === "Gambar") return <FileImage className="w-5 h-5 text-emerald-600" />;
  return <FileText className="w-5 h-5 text-indigo-600" />;
}

export default function AdminReferencesClient({ initialReferences }: { initialReferences: TeacherReference[] }) {
  const [references, setReferences] = useState(initialReferences);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TeacherReference | null>(null);
  const [toDelete, setToDelete] = useState<TeacherReference | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [fileType, setFileType] = useState("PDF");

  const resetForm = () => {
    setTitle("");
    setDriveUrl("");
    setFileType("PDF");
    setEditingId(null);
    setIsFormOpen(false);
  };

  const startEdit = (reference: TeacherReference) => {
    setEditingId(reference.id);
    setTitle(reference.title);
    setDriveUrl(reference.driveUrl);
    setFileType(reference.fileType);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = { title, driveUrl, fileType };
      const result = editingId
        ? await updateTeacherReference(editingId, data)
        : await createTeacherReference(data);

      if (!result.success) {
        toast.error("Referensi gagal disimpan.");
        return;
      }

      toast.success(editingId ? "Referensi diperbarui." : "Referensi ditambahkan.");
      resetForm();
      window.location.reload();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Referensi gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteTeacherReference(toDelete.id);
      setReferences(references.filter((reference) => reference.id !== toDelete.id));
      toast.success("Referensi dihapus.");
      setToDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Referensi gagal dihapus.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="card-soft border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 p-6 flex flex-col items-center justify-center text-primary font-bold transition-all"
        >
          <Plus className="w-8 h-8 mb-2" />
          Tambah Modul / Referensi
        </button>
      ) : (
        <div className="card-soft p-6 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{editingId ? "Edit Referensi" : "Referensi Baru"}</h2>
            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-red-500" title="Batal">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Modul / Referensi</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Contoh: Modul Pembelajaran Matematika" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis File</label>
                <select value={fileType} onChange={(event) => setFileType(event.target.value)} className="w-full px-4 py-2.5 border rounded-xl outline-none bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {FILE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link Google Drive / Docs</label>
                <input type="url" value={driveUrl} onChange={(event) => setDriveUrl(event.target.value)} required className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="https://drive.google.com/file/d/.../view" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Atur akses file menjadi “Siapa saja yang memiliki link” agar dapat dipreview oleh guru.</p>
            <button disabled={loading} className="py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? "Simpan Perubahan" : "Simpan Referensi"}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {references.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">Belum ada modul atau referensi.</div>}
        {references.map((reference) => (
          <div key={reference.id} className="card-soft p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">{getTypeIcon(reference.fileType)}</div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{reference.title}</h3>
                <span className="inline-flex mt-1 text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{reference.fileType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPreview(reference)} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 flex items-center gap-1.5"><Eye className="w-4 h-4" /> Preview</button>
              <button onClick={() => startEdit(reference)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl" title="Edit"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => setToDelete(reference)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Hapus"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[160] bg-gray-950/70 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between gap-3"><div className="flex items-center gap-2 min-w-0"><BookOpen className="w-5 h-5 text-primary shrink-0" /><h2 className="font-bold truncate">{preview.title}</h2></div><button onClick={() => setPreview(null)} className="p-2 text-gray-500 hover:text-red-500"><X className="w-5 h-5" /></button></div>
            <iframe src={preview.driveUrl} title={preview.title} className="w-full flex-1 border-0" allow="autoplay" />
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} isLoading={loading} title="Hapus Referensi" message={<>Hapus referensi <strong>{toDelete?.title}</strong> secara permanen?</>} confirmText="Ya, Hapus" />
    </div>
  );
}
