"use client";

import { useState } from "react";
import { X, Megaphone, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
import { createAnnouncement, deleteAnnouncement } from "@/app/admin/actions";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function ManageAnnouncementsModal({ 
  announcements,
  onClose 
}: { 
  announcements: any[],
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || content === "<p><br></p>") {
      toast.error("Judul dan isi pengumuman tidak boleh kosong!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Mengunggah pengumuman...");
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    
    try {
      await createAnnouncement(formData);
      toast.success("Pengumuman berhasil diunggah!", { id: toastId });
      setTitle("");
      setContent("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman ini secara permanen?")) return;
    
    setIsDeleting(id);
    const toastId = toast.loading("Menghapus...");
    try {
      await deleteAnnouncement(id);
      toast.success("Pengumuman dihapus", { id: toastId });
      onClose(); // Menutup modal agar data di-refresh
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus", { id: toastId });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h2 className="text-xl font-bold text-text-header flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Kelola Papan Pengumuman
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Kolom Tulis Baru */}
          <div className="w-full md:w-3/5 p-6 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4">Tulis Pengumuman Baru</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Pengumuman</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cth: Update Fitur Baru!" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col flex-1 pb-12">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Isi Pengumuman</label>
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    className="h-48 rounded-b-xl"
                  />
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
                {loading ? "Menyimpan..." : "Unggah Pengumuman"}
              </button>
            </form>
          </div>

          {/* Kolom Riwayat */}
          <div className="w-full md:w-2/5 p-6 bg-gray-50/50 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4">Riwayat Pengumuman</h3>
            
            {announcements.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Belum ada pengumuman
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</h4>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-2 bg-gray-50 w-fit px-2 py-1 rounded">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
