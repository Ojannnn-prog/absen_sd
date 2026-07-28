"use client";

import { useState } from "react";
import { createResource, deleteResource, updateResource } from "./actions";
import toast from "react-hot-toast";
import { Trash2, Plus, FileText, Video, Image as ImageIcon, Headphones, Loader2, Edit2, Save, HelpCircle, AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminResourcesClient({ initialResources }: { initialResources: any[] }) {
  const [resources, setResources] = useState(initialResources);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<{ id: string; title: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Text");
  const [description, setDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);

  const resetForm = () => {
    setTitle("");
    setType("Text");
    setDescription("");
    setDriveUrl("");
    setQuestions([]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (res: any) => {
    setTitle(res.title);
    setType(res.type);
    setDescription(res.description || "");
    setDriveUrl(res.driveUrl || "");
    setQuestions(res.questions || []);
    setEditingId(res.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addQuestion = () => {
    if (questions.length >= 5) {
      toast.error("Maksimal 5 soal untuk setiap Quiz!");
      return;
    }
    setQuestions([...questions, { text: "", optionA: "", optionB: "", optionC: "", correctAnswer: "A" }]);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Judul wajib diisi!");
      return;
    }
    
    if (type === "Quiz") {
      if (questions.length === 0) {
        toast.error("Quiz harus memiliki minimal 1 soal!");
        return;
      }
      for (const q of questions) {
        if (!q.text || !q.optionA || !q.optionB || !q.optionC) {
          toast.error("Semua kolom soal dan pilihan ganda wajib diisi!");
          return;
        }
      }
    } else {
      if (!driveUrl) {
        toast.error("Link Drive wajib diisi untuk materi reguler!");
        return;
      }
    }

    setLoading(true);
    // Auto-fix Google Drive URLs from /view to /preview
    let formattedUrl = driveUrl;
    if (formattedUrl.includes('/view')) {
      formattedUrl = formattedUrl.replace('/view', '/preview');
    }

    // Default duration: Video (random 10-30), Quiz (30 fixed), Text/Audio (5-15)
    let finalDuration = 10;
    if (type === "Quiz") finalDuration = 30;
    else if (type === "Video") finalDuration = Math.floor(Math.random() * 20) + 10;
    else finalDuration = Math.floor(Math.random() * 10) + 5;

    const dataPayload = {
      title,
      type,
      description,
      driveUrl: type === "Quiz" ? "" : formattedUrl,
      durationMins: finalDuration,
      questions: type === "Quiz" ? questions.map(q => ({
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        correctAnswer: q.correctAnswer
      })) : undefined
    };

    try {
      if (editingId) {
        const res = await updateResource(editingId, dataPayload);
        if (res.success) {
          toast.success("Materi berhasil diperbarui!");
          resetForm();
          window.location.reload(); 
        } else {
          toast.error(res.message || "Gagal");
        }
      } else {
        const res = await createResource(dataPayload);
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

  const handleDeleteClick = (id: string, title: string) => {
    setResourceToDelete({ id, title });
  };

  const executeDeleteResource = async () => {
    if (!resourceToDelete) return;
    const { id } = resourceToDelete;
    setResourceToDelete(null);
    
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
      case "Quiz": return <HelpCircle className="w-5 h-5 text-red-500" />;
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
          Tambah Sesi Baru (Materi / Quiz)
        </button>
      ) : (
        <div className="card-soft p-6 border-2 border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{editingId ? 'Edit Sesi' : 'Sesi Baru'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-red-500 text-sm font-bold">Batal</button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Sesi</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  placeholder="Misal: Bab 1 Pendahuluan atau Evaluasi Akhir"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipe Sesi</label>
                <select 
                  value={type} 
                  onChange={e => {
                    setType(e.target.value);
                    if (e.target.value !== "Quiz") setQuestions([]);
                  }}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white font-bold"
                >
                  <option value="Text">Teks / Dokumen</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio / Podcast</option>
                  <option value="Photo">Foto / Gambar</option>
                  <option value="Quiz" className="text-red-600 font-bold bg-red-50">Quiz / Ujian</option>
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
                placeholder="Misal: Wajib dikerjakan..."
              />
            </div>

            {type === "Quiz" ? (
              <div className="mt-4 border-2 border-dashed border-red-200 rounded-xl p-4 bg-red-50/30">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-red-500" /> Daftar Soal Ujian
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Buat maksimal 5 soal pilihan ganda. KKM kelulusan adalah 60.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={addQuestion}
                    disabled={questions.length >= 5}
                    className="px-3 py-1.5 bg-red-100 text-red-600 font-bold text-sm rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    + Tambah Soal
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative">
                      <button 
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="pr-8 mb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Soal {idx + 1}</label>
                        <textarea 
                          value={q.text}
                          onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                          placeholder="Pertanyaan..."
                          rows={2}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Pilihan A</label>
                          <input 
                            type="text" value={q.optionA} onChange={(e) => updateQuestion(idx, 'optionA', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400" required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Pilihan B</label>
                          <input 
                            type="text" value={q.optionB} onChange={(e) => updateQuestion(idx, 'optionB', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400" required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Pilihan C</label>
                          <input 
                            type="text" value={q.optionC} onChange={(e) => updateQuestion(idx, 'optionC', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400" required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500">Kunci Jawaban Benar:</label>
                        <select 
                          value={q.correctAnswer} 
                          onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value)}
                          className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 font-bold rounded-lg text-sm outline-none"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  
                  {questions.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-red-200 rounded-xl text-gray-400 text-sm">
                      Belum ada soal dibuat. Klik "+ Tambah Soal".
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                  Pastikan akses link Drive diatur ke "Siapa saja yang memiliki link" (Anyone with the link).
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`mt-2 py-3 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary-hover'} text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
              {editingId ? 'Simpan Perubahan' : 'Simpan Sesi'}
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
          <div key={res.id} className={`card-soft p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors ${res.type === 'Quiz' ? 'border-red-100 bg-red-50/10' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${res.type === 'Quiz' ? 'bg-red-100 text-red-600' : 'bg-gray-50 border border-gray-100 text-gray-300'}`}>
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {getTypeIcon(res.type)}
                  {res.title}
                </h3>
                <p className="text-sm text-gray-500">{res.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${res.type === 'Quiz' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{res.type}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md">⏳ {res.type === 'Quiz' ? '30' : res.durationMins} Menit</span>
                  {res.type === 'Quiz' && (
                     <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-md">{res.questions?.length || 0} Soal</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {res.type !== 'Quiz' && (
                <a 
                  href={res.driveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors border border-gray-200"
                >
                  Cek Link
                </a>
              )}
              <button 
                onClick={() => handleEditClick(res)}
                className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                title="Edit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDeleteClick(res.id, res.title)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Resource Confirm Modal */}
      <ConfirmModal
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onConfirm={executeDeleteResource}
        title="Hapus Materi Belajar"
        message={
          <>
            Apakah Anda yakin ingin menghapus materi <strong className="text-gray-900 font-bold">&ldquo;{resourceToDelete?.title}&rdquo;</strong> secara permanen?
          </>
        }
        confirmText="Ya, Hapus Materi"
        variant="danger"
      />
    </div>
  );
}
