"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2, CreditCard } from "lucide-react";
import QRCode from "qrcode";

import toast from "react-hot-toast";

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
    const loadingToast = toast.loading("Mencetak KTA Digital...");

    try {
      // Brief delay to ensure styles and fonts are fully painted
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // Very high resolution for printing
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false, // Matikan log agar tidak nyampah di console
      });

      const imgData = canvas.toDataURL("image/png");
      
      // ID-1 standard size: 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98]
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`KTA_${student.name.replace(/\\s+/g, '_')}_${student.studentCode}.pdf`);
      
      toast.success("KTA berhasil dicetak!", { id: loadingToast });
    } catch (error) {
      console.error("Failed to generate KTA PDF:", error);
      toast.error("Gagal mencetak KTA. Pastikan internet stabil dan coba lagi.", { id: loadingToast, duration: 5000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const KtaContent = () => (
    <>
      <div className="absolute inset-0 bg-[#f8fafc]"></div>

      <div className="absolute top-0 left-0 w-full h-[80px] bg-blue-700 shadow-md flex items-center px-8 z-10" style={{ borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}>
        <div className="flex-1">
          <h1 className="text-white font-black text-2xl tracking-wider drop-shadow-md">SDN 231 SUKAASIH</h1>
          <p className="text-blue-100 font-bold text-sm tracking-widest uppercase opacity-90">Kartu Tanda Anggota</p>
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 shadow-inner">
          <BookIcon style={{ width: '28px', height: '28px' }} className="text-white drop-shadow-sm" />
        </div>
      </div>

      <div className="absolute top-[100px] left-8 right-8 flex gap-6 z-20">
        <div className="flex-1 flex flex-col pt-1 min-w-0">
          <h2 className="text-[24px] font-black text-gray-900 leading-[1.2] mb-2 drop-shadow-sm pr-4 whitespace-normal" style={{ wordBreak: 'break-word', maxHeight: '60px', overflow: 'hidden' }}>
            {student.name}
          </h2>
          <div className="w-16 h-1 bg-yellow-400 rounded-full mb-4 shrink-0"></div>

          <div className="flex flex-col gap-3 w-full shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Induk Siswa (NIS)</span>
              <span className="text-xl font-black text-gray-800 font-mono tracking-wider">{student.studentCode}</span>
            </div>
            
            <div className="flex gap-10">
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
          
          <div className="mt-4 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm w-fit tracking-wider">
            Siswa Aktif
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-8 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center z-20">
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="QR Code" className="w-[60px] h-[60px]" crossOrigin="anonymous" />
        )}
      </div>
      
      <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-blue-50" style={{ borderTopLeftRadius: '200px' }} />
    </>
  );

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

      {/* Target html2canvas sebenar-benarnya (Off-screen & Pure tanpa Scale) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div ref={cardRef} className="w-[600px] h-[378px] bg-gray-50 relative overflow-hidden">
          <KtaContent />
        </div>
      </div>

      {/* Display UI (Visual only) */}
      <div className="relative w-[340px] h-[214px] sm:w-[400px] sm:h-[252px] shadow-2xl rounded-2xl overflow-hidden shrink-0 group transition-transform hover:scale-[1.02]">
        <div className="absolute top-0 left-0 origin-top-left scale-[0.5666] sm:scale-[0.6666] pointer-events-none" aria-hidden="true">
          <div className="w-[600px] h-[378px] bg-gray-50 relative overflow-hidden">
            <KtaContent />
          </div>
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
