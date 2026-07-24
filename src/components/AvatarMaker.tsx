"use client";

import { useState, useMemo } from "react";
import { Save, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const OPTIONS = {
  top: ["bob", "bun", "curly", "dreads", "shaggy", "shortCurly", "shortFlat", "shortRound", "shortWaved", "theCaesar", "hijab", "turban", "winterHat1"],
  accessories: ["blank", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"],
  clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall"],
  skinColor: ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"],
  mouth: ["default", "smile", "twinkle", "serious", "concerned", "eating"],
  eyes: ["default", "happy", "surprised", "wink", "squint"]
};

interface Props {
  initialConfig?: string | null; // Data URI if previously saved
  studentName: string;
}

export default function AvatarMaker({ initialConfig, studentName }: Props) {
  const [top, setTop] = useState(OPTIONS.top[2]);
  const [accessories, setAccessories] = useState(OPTIONS.accessories[0]);
  const [clothing, setClothing] = useState(OPTIONS.clothing[4]);
  const [skinColor, setSkinColor] = useState(OPTIONS.skinColor[3]);
  const [mouth, setMouth] = useState(OPTIONS.mouth[1]);
  const [eyes, setEyes] = useState(OPTIONS.eyes[1]);
  
  const [isSaving, setIsSaving] = useState(false);

  // Generate URL
  const avatarUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append("seed", studentName);
    if (top && top !== "blank") params.append("top", top);
    if (accessories && accessories !== "blank") params.append("accessories", accessories);
    if (clothing && clothing !== "blank") params.append("clothing", clothing);
    if (skinColor && skinColor !== "blank") params.append("skinColor", skinColor);
    if (mouth && mouth !== "blank") params.append("mouth", mouth);
    if (eyes && eyes !== "blank") params.append("eyes", eyes);
    params.append("backgroundColor", "e0f2fe,fce7f3,dcfce7,fef3c7");
    
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }, [top, accessories, clothing, skinColor, mouth, eyes, studentName]);

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
    const toastId = toast.loading("Menyimpan Avatar...");
    
    try {
      const res = await fetch("/api/student/shop/save-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success("Avatar berhasil disimpan! Akan muncul di Leaderboard.", { id: toastId });
        window.location.reload();
      } else {
        toast.error(data.error || "Gagal menyimpan avatar", { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card-soft p-6 md:p-8 bg-white border-2 border-indigo-100 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400 opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <Sparkles className="w-8 h-8 text-indigo-500" />
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Avatar Maker</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        {/* Preview Panel */}
        <div className="flex flex-col items-center gap-6 md:w-1/3">
          <div className="w-48 h-48 rounded-3xl overflow-hidden border-4 border-indigo-100 shadow-xl bg-gray-50 flex items-center justify-center relative group">
            <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          </div>
          
          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={handleRandomize}
              className="w-full bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Acak Avatar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? "Menyimpan..." : <><Save className="w-5 h-5" /> Simpan & Gunakan</>}
            </button>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Rambut / Penutup Kepala</label>
            <select value={top} onChange={(e) => setTop(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              {OPTIONS.top.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Aksesoris (Kacamata)</label>
            <select value={accessories} onChange={(e) => setAccessories(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              {OPTIONS.accessories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pakaian</label>
            <select value={clothing} onChange={(e) => setClothing(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              {OPTIONS.clothing.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Warna Kulit</label>
            <select value={skinColor} onChange={(e) => setSkinColor(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              <option value="ffdbb4">Putih / Terang</option>
              <option value="edb98a">Kuning Langsat</option>
              <option value="f8d25c">Kuning Ceria</option>
              <option value="fd9841">Oranye Hangat</option>
              <option value="d08b5b">Cokelat Muda</option>
              <option value="ae5d29">Cokelat Gelap</option>
              <option value="614335">Hitam Manis</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mata</label>
            <select value={eyes} onChange={(e) => setEyes(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              {OPTIONS.eyes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mulut</label>
            <select value={mouth} onChange={(e) => setMouth(e.target.value)} className="form-input rounded-xl border-gray-200 bg-gray-50 font-medium py-2.5 px-3">
              {OPTIONS.mouth.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
