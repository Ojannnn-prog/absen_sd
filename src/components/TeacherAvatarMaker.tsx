"use client";

import { useState, useMemo } from "react";
import { Save, RefreshCw, Sparkles, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { updateTeacherProfile } from "@/app/teacher/actions";

const OPTIONS = {
  top: ["bob", "bun", "curly", "dreads", "shaggy", "shortCurly", "shortFlat", "shortRound", "shortWaved", "theCaesar", "hijab", "turban", "winterHat1"],
  accessories: ["blank", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"],
  clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall"],
  skinColor: ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"],
  mouth: ["default", "smile", "twinkle", "serious", "concerned", "eating"],
  eyes: ["default", "happy", "surprised", "wink", "squint"]
};

interface Props {
  initialConfig?: string | null;
  teacherName: string;
}

export default function TeacherAvatarMaker({ initialConfig, teacherName }: Props) {
  const [top, setTop] = useState(OPTIONS.top[2]);
  const [accessories, setAccessories] = useState(OPTIONS.accessories[0]);
  const [clothing, setClothing] = useState(OPTIONS.clothing[0]);
  const [skinColor, setSkinColor] = useState(OPTIONS.skinColor[3]);
  const [mouth, setMouth] = useState(OPTIONS.mouth[1]);
  const [eyes, setEyes] = useState(OPTIONS.eyes[1]);
  
  const [isSaving, setIsSaving] = useState(false);

  // Generate URL
  const avatarUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append("seed", teacherName);
    if (top && top !== "blank") params.append("top", top);
    if (accessories && accessories !== "blank") params.append("accessories", accessories);
    if (clothing && clothing !== "blank") params.append("clothing", clothing);
    if (skinColor && skinColor !== "blank") params.append("skinColor", skinColor);
    if (mouth && mouth !== "blank") params.append("mouth", mouth);
    if (eyes && eyes !== "blank") params.append("eyes", eyes);
    params.append("backgroundColor", "e0f2fe,fce7f3,dcfce7,fef3c7");
    
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }, [top, accessories, clothing, skinColor, mouth, eyes, teacherName]);

  const handleRandomize = () => {
    setTop(OPTIONS.top[Math.floor(Math.random() * OPTIONS.top.length)]);
    setAccessories(OPTIONS.accessories[Math.floor(Math.random() * OPTIONS.accessories.length)]);
    setClothing(OPTIONS.clothing[Math.floor(Math.random() * OPTIONS.clothing.length)]);
    setSkinColor(OPTIONS.skinColor[Math.floor(Math.random() * OPTIONS.skinColor.length)]);
    setMouth(OPTIONS.mouth[Math.floor(Math.random() * OPTIONS.mouth.length)]);
    setEyes(OPTIONS.eyes[Math.floor(Math.random() * OPTIONS.eyes.length)]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Menyimpan Avatar Guru...");
    
    try {
      const res = await updateTeacherProfile({ avatarConfig: avatarUrl });
      if (res.success) {
        toast.success("Avatar Guru berhasil disimpan!", { id: toastId });
        window.location.reload();
      } else {
        toast.error(res.message || "Gagal menyimpan avatar", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-soft p-6 md:p-8 bg-white border-2 border-amber-200 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-500" />
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Avatar Maker (Guru)</h2>
            <p className="text-xs text-amber-700 font-bold flex items-center gap-1 mt-0.5">
              <Crown className="w-3.5 h-3.5" />
              Teacher Premium - Semua Akses Avatar Terbuka
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        {/* Preview Panel */}
        <div className="flex flex-col items-center gap-6 md:w-1/3">
          <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-amber-200 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative group">
            <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          </div>
          
          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={handleRandomize}
              className="w-full bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Acak Posisi / Style
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Menyimpan..." : "Simpan Avatar"}
            </button>
          </div>
        </div>

        {/* Options Panel */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Rambut / Atasan</label>
            <select 
              value={top}
              onChange={(e) => setTop(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.top.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Aksesoris / Kacamata</label>
            <select 
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.accessories.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Pakaian</label>
            <select 
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.clothing.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Warna Kulit</label>
            <select 
              value={skinColor}
              onChange={(e) => setSkinColor(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.skinColor.map((t, idx) => (
                <option key={t} value={t}>Tone {idx + 1}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Mulut / Senyum</label>
            <select 
              value={mouth}
              onChange={(e) => setMouth(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.mouth.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Mata / Ekspresi</label>
            <select 
              value={eyes}
              onChange={(e) => setEyes(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {OPTIONS.eyes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
