"use client";

import { useState } from "react";
import { createResource, deleteResource, updateResource } from "./actions";
import toast from "react-hot-toast";
import { Trash2, Plus, FileText, Video, Image as ImageIcon, Headphones, Loader2, Edit2, Save } from "lucide-react";

export default function AdminResourcesClient({ initialResources }: { initialResources: any[] }) {
  const [resources, setResources] = useState(initialResources);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Text");
  const [description, setDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  const resetForm = () => {
    setTitle("");
    setType("Text");
    setDescription("");
    setDriveUrl("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (res: any) => {
    setTitle(res.title);
    setType(res.type);
    setDescription(res.description || "");
    setDriveUrl(res.driveUrl);
    setEditingId(res.id);
    setIsAdding(true); // Open the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !driveUrl) {
      toast.error("Judul dan Link Drive wajib diisi!");
      return;
    }

    setLoading(true);
    // Auto-fix Google Drive URLs from /view to /preview
    let formattedUrl = driveUrl;
    if (formattedUrl.includes('/view')) {
      formattedUrl = formattedUrl.replace('/view', '/preview');
    }

    // Generate random duration between 5 to 30 mins based on type if new, or keep logic simple for edit too
    const randomMins = type === 'Video' ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 10) + 5;

    try {
      if (editingId) {
        const res = await updateResource(editingId, {
          title,
          type,
          description,
          driveUrl: formattedUrl,
          durationMins: randomMins // we can randomize again or keep it, random is fine for this scope
        });

        if (res.success) {
          toast.success("Materi berhasil diperbarui!");
          resetForm();
          window.location.reload(); 
        } else {
          toast.error(res.message || "Gagal");
        }
      } else {
        const res = await createResource({
          title,
          type,
          description,
          driveUrl: formattedUrl,
          durationMins: randomMins
        });

        if (res.success) {
          toast.success("Materi berhasil ditambahkan!");
          resetForm();
          window.location.reload(); 
        } else {
          toast.error(res.message || "Gagal");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus materi ini?")) return;
    
    toast.loading("Menghapus...", { id: "delete" });
    try {
      const res = await deleteResource(id);
      if (res.success) {
        toast.success("Materi dihapus", { id: "delete" });
        setResources(resources.filter(r => r.id !== id));
      } else {
        toast.error(res.message || "Gagal", { id: "delete" });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan", { id: "delete" });
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "Video": return <Video className="w-5 h-5 text-purple-500" />;
      case "Audio": return <Headphones className="w-5 h-5 text-yellow-500" />;
      case "Photo": return <ImageIcon className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="card-soft border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 p-6 flex flex-col items-center justify-center text-primary font-bold transition-all"
        >
          <Plus className="w-8 h-8 mb-2" />
          Tambah Materi Baru
        </button>
      ) : (
        <div className="card-soft p-6 border-2 border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{editingId ? 'Edit Materi' : 'Materi Baru'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-red-500 text-sm font-bold">Batal</button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Materi</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Misal: Bab 1 Pendahuluan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe Materi</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                  <option value="Text">Teks / Dokumen</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio / Podcast</option>
                  <option value="Photo">Foto / Gambar</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Singkat</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Misal: Bacaan wajib sebelum ujian..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Google Drive Embed URL</label>
              <input 
                type="url" 
                value={driveUrl} 
                onChange={e => setDriveUrl(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="https://drive.google.com/file/d/.../preview"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pastikan akses link Drive diatur ke "Siapa saja yang memiliki link" (Anyone with the link). Gunakan link berakhiran <b>/preview</b>.
              </p>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className={`mt-2 py-3 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary-hover'} text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
              {editingId ? 'Simpan Perubahan' : 'Simpan Materi'}
            </button>
          </form>
        </div>
      )}

      {/* List Materi */}
      <div className="flex flex-col gap-3">
        {resources.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            Belum ada materi pembelajaran yang ditambahkan.
          </div>
        )}
        
        {resources.map((res, i) => (
          <div key={res.id} className="card-soft p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-black text-gray-300">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {getTypeIcon(res.type)}
                  {res.title}
                </h3>
                <p className="text-sm text-gray-500">{res.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md uppercase">{res.type}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">⏳ {res.durationMins} Menit</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href={res.driveUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors border border-gray-200"
              >
                Cek Link
              </a>
              <button 
                onClick={() => handleEditClick(res)}
                className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(res.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
