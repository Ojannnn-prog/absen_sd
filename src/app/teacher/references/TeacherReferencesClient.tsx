"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { BookOpen, Check, FileAudio, FileImage, FileText, FileVideo, Menu, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { saveTeacherReferenceNote } from "./actions";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type TeacherReference = {
  id: string;
  title: string;
  driveUrl: string;
  fileType: string;
  note: { content: string; updatedAt: string | Date } | null;
};

const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

function getTypeIcon(fileType: string) {
  if (fileType === "Video") return <FileVideo className="w-5 h-5 text-purple-600" />;
  if (fileType === "Audio") return <FileAudio className="w-5 h-5 text-amber-600" />;
  if (fileType === "Gambar") return <FileImage className="w-5 h-5 text-emerald-600" />;
  return <FileText className="w-5 h-5 text-indigo-600" />;
}

export default function TeacherReferencesClient({ initialReferences }: { initialReferences: TeacherReference[] }) {
  const [references, setReferences] = useState(initialReferences);
  const [selectedId, setSelectedId] = useState(initialReferences[0]?.id || "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selected = useMemo(
    () => references.find((reference) => reference.id === selectedId) || references[0],
    [references, selectedId]
  );
  const [noteContent, setNoteContent] = useState(selected?.note?.content || "");

  const selectReference = (reference: TeacherReference) => {
    setSelectedId(reference.id);
    setNoteContent(reference.note?.content || "");
    setSidebarOpen(false);
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await saveTeacherReferenceNote(selected.id, noteContent);
      setReferences((current) => current.map((reference) => reference.id === selected.id ? { ...reference, note: { content: noteContent, updatedAt: new Date().toISOString() } } : reference));
      toast.success("Catatan tersimpan.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Catatan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (!selected) {
    return (
      <div className="card-soft p-12 text-center text-gray-500 w-full">
        Belum ada modul atau referensi yang tersedia dari admin.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Modul & Referensi</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Buka bahan rujukan dari admin dan simpan catatan pribadi untuk setiap modul.
          </p>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl shadow-md shrink-0" title="Daftar referensi">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-6 w-full min-w-0">
        <aside className={`${sidebarOpen ? "fixed inset-0 z-[140] bg-gray-900/40 p-4" : "hidden"} md:block md:static md:bg-transparent md:p-0`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 md:sticky md:top-4 max-w-sm mx-auto md:max-w-none">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Daftar Modul</h2>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-3 max-h-[65vh] overflow-y-auto">
              {references.map((reference) => (
                <button
                  key={reference.id}
                  onClick={() => selectReference(reference)}
                  className={`text-left p-3 rounded-xl flex items-start gap-3 transition-colors w-full min-w-0 ${selected.id === reference.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"}`}
                >
                  <span className="mt-0.5 shrink-0">{getTypeIcon(reference.fileType)}</span>
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block text-sm font-bold text-gray-900 truncate">{reference.title}</span>
                    <span className="text-xs text-gray-500">{reference.fileType}{reference.note?.content ? " • Ada catatan" : ""}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full min-w-0">
            <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 truncate">{selected.title}</h2>
                <span className="inline-flex mt-1 text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                  {selected.fileType}
                </span>
              </div>
              <button onClick={() => setNoteOpen(true)} className="shrink-0 hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm transition-colors">
                <BookOpen className="w-4 h-4" /> Catatan Saya
              </button>
            </div>
            <iframe src={selected.driveUrl} title={selected.title} className="w-full h-[60vh] sm:h-[65vh] min-h-[350px] border-0" allow="autoplay" />
          </div>
        </section>
      </div>

      <button onClick={() => setNoteOpen(true)} className="fixed right-3 top-1/2 -translate-y-1/2 z-30 sm:hidden w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center" title="Buka catatan"><BookOpen className="w-6 h-6" /></button>

      {noteOpen && <div className="fixed inset-0 z-[150] bg-gray-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"><div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"><div className="p-4 border-b flex items-center justify-between gap-3"><div><h2 className="font-black text-gray-900">Catatan: {selected.title}</h2><p className="text-xs text-gray-500 mt-1">Catatan ini hanya tersimpan pada modul yang sedang dibuka.</p></div><button onClick={() => setNoteOpen(false)} className="p-2 text-gray-500 hover:text-red-500"><X className="w-5 h-5" /></button></div><div className="p-4 overflow-y-auto"><ReactQuill theme="snow" value={noteContent} onChange={setNoteContent} modules={editorModules} placeholder="Tulis rangkuman atau bagian penting modul ini..." className="reference-note-editor" /></div><div className="p-4 border-t flex justify-end"><button onClick={saveNote} disabled={saving} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60">{saving ? <span className="animate-pulse">Menyimpan...</span> : <><Save className="w-4 h-4" /> Simpan Catatan</>}{!saving && <Check className="w-4 h-4" />}</button></div></div></div>}
    </div>
  );
}
