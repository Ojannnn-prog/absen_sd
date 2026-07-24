"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2, CreditCard } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  student: {
    name: string;
    studentCode: string;
    birthPlace: string | null;
    birthDate: Date | string | null;
    gender: string;
    profileImage: string | null;
  };
}

export default function StudentKTACard({ student }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    // Generate QR Code once on mount
    QRCode.toDataURL(student.studentCode, {
      width: 200,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    }).then(setQrCodeUrl).catch(console.error);
  }, [student.studentCode]);

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Brief delay to ensure styles and fonts are fully painted
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Temporarily remove border radius for perfect edge-to-edge PDF if we want it,
      // but it looks better with rounded corners inside the PDF or just let it have white corners.
      // Usually, print cards have square corners which are die-cut later. We'll leave it as is.
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // Very high resolution for printing
        useCORS: true, 
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      
      // ID-1 standard size: 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98]
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`KTA_${student.name.replace(/\s+/g, '_')}_${student.studentCode}.pdf`);
      
    } catch (error) {
      console.error("Failed to generate KTA PDF:", error);
      alert("Gagal mencetak KTA. Pastikan koneksi internet stabil untuk memuat aset gambar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const encodedName = encodeURIComponent(student.name);
  const avatarBg = student.gender === 'L' ? 'e0f2fe' : 'fce7f3';
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodedName}&backgroundColor=${avatarBg}`;
  const avatarUrl = student.profileImage || defaultAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          KTA Digital
        </h3>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isGenerating ? "Mencetak..." : "Cetak PDF"}
        </button>
      </div>

      {/* The actual Card (hidden overflow to render cleanly) */}
      {/* We use a specific aspect ratio container (85.6 / 53.98 = 1.585) 
          Base size: width 400px, height 252px */}
      <div 
        className="relative w-[340px] h-[214px] sm:w-[400px] sm:h-[252px] shadow-2xl rounded-2xl overflow-hidden shrink-0 group transition-transform hover:scale-[1.02]"
      >
        {/* The target for html2canvas. We keep it unscaled inside so the resolution is stable. 
            We force it to exactly 600px x 378px to ensure high quality rendering, and use CSS transform to scale it down to fit the wrapper. */}
        <div 
          ref={cardRef}
          className="absolute top-0 left-0 w-[600px] h-[378px] bg-white origin-top-left scale-[0.5666] sm:scale-[0.6666]"
          style={{
            backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\"><defs><pattern id=\"dots\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"2\" cy=\"2\" r=\"1.5\" fill=\"%23e2e8f0\"/></pattern></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23dots)\"/></svg>')",
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full h-[80px] bg-gradient-to-r from-blue-600 to-indigo-700 rounded-b-[40px] shadow-md flex items-center px-8 z-10">
            <div className="flex-1">
              <h1 className="text-white font-black text-2xl tracking-wider drop-shadow-md">SDN 231 SUKAASIH</h1>
              <p className="text-blue-100 font-bold text-sm tracking-widest uppercase opacity-90">Kartu Tanda Anggota</p>
            </div>
            {/* Pseudo Logo */}
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40 shadow-inner">
              <BookIcon className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
          </div>

          {/* Content Area */}
          <div className="absolute top-[100px] left-8 right-8 flex gap-6 z-20">
            {/* Photo Left */}
            <div className="flex flex-col gap-2 items-center w-[120px] shrink-0">
              <div className="w-[110px] h-[140px] bg-gray-100 rounded-xl overflow-hidden shadow-lg border-4 border-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
              <div className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm w-full text-center tracking-wider">
                Siswa Aktif
              </div>
            </div>

            {/* Details Right */}
            <div className="flex-1 flex flex-col pt-1">
              <h2 className="text-3xl font-black text-gray-900 leading-none mb-1 drop-shadow-sm truncate pr-4">
                {student.name}
              </h2>
              <div className="w-12 h-1 bg-yellow-400 rounded-full mb-4"></div>

              <div className="flex flex-col gap-2.5 w-full">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Induk Siswa (NIS)</span>
                  <span className="text-lg font-black text-gray-800 font-mono tracking-wider">{student.studentCode}</span>
                </div>
                
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempat, Tgl Lahir</span>
                    <span className="text-sm font-bold text-gray-700">{student.birthPlace || "-"}, {formatDate(student.birthDate)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</span>
                    <span className="text-sm font-bold text-gray-700">{student.gender === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Bottom Right */}
          <div className="absolute bottom-6 right-8 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-[60px] h-[60px]" crossOrigin="anonymous" />
            )}
          </div>
          
          {/* Decorative Bottom shape */}
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-blue-600/5 rounded-tl-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// Simple book icon for the logo placeholder
function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
