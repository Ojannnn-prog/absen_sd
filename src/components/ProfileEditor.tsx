"use client";

import { useState, useRef } from "react";
import { Camera, Edit2, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateProfile } from "@/app/student/actions";
import { useRouter } from "next/navigation";

export default function ProfileEditor({ 
  initialNickname, 
  studentName 
}: { 
  initialNickname: string | null,
  studentName: string
}) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nickname, setNickname] = useState(initialNickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      toast.error("Nickname tidak boleh kosong!");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await updateProfile(nickname, undefined as any);
      if (res.success) {
        toast.success("Nickname berhasil disimpan!");
        setIsEditingName(false);
        router.refresh();
      } else {
        toast.error("Gagal menyimpan nickname");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size > 2MB just in case before compression
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file asli maksimal 2MB!");
      return;
    }

    setIsSaving(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = async () => {
        // Compress image using canvas
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 jpeg with 0.8 quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);

        try {
          const res = await updateProfile(undefined as any, compressedBase64);
          if (res.success) {
            toast.success("Foto profil berhasil diperbarui!");
            router.refresh();
          } else {
            toast.error("Gagal menyimpan foto");
          }
        } catch (error) {
          toast.error("Gagal upload foto");
        } finally {
          setIsSaving(false);
        }
      };
    };
  };

  return (
    <div className="flex flex-col items-center md:items-start w-full">
      {/* Upload button hidden input */}
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleImageUpload}
        disabled={isSaving}
      />
      
      {/* Upload trigger button is handled by parent UI, we only expose the logic here. 
          Wait, it's better to render the name editor here. */}
      
      <div className="flex flex-col items-center md:items-start mt-2">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ketik Username Game..."
              className="px-3 py-1.5 border-2 border-[var(--theme-primary,var(--color-primary))] rounded-lg focus:outline-none font-bold text-gray-900 w-32 sm:w-48"
              maxLength={15}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
            />
            <button 
              onClick={handleSaveNickname}
              disabled={isSaving}
              className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => {
                setIsEditingName(false);
                setNickname(initialNickname || "");
              }}
              disabled={isSaving}
              className="p-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            <h1 className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
              {initialNickname || "Player Baru"}
            </h1>
            <button 
              onClick={() => setIsEditingName(true)}
              className="p-1.5 text-gray-400 hover:text-[var(--theme-primary,var(--color-primary))] hover:bg-[var(--theme-primary,var(--color-primary))]/10 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="Ganti Username Game"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Real name as placeholder below */}
        <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1">
          <span className="opacity-70">Nama Asli:</span> {studentName}
        </p>
      </div>

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isSaving}
        className="mt-4 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 hover:border-[var(--theme-primary,var(--color-primary))] hover:text-[var(--theme-primary,var(--color-primary))] transition-all w-full md:w-auto"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        Ganti Foto Profil
      </button>
    </div>
  );
}
