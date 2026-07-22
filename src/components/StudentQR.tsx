"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function StudentQR({ studentCode, name }: { studentCode: string, name: string }) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    // Generate QR with the studentCode
    QRCode.toDataURL(studentCode, {
      width: 200,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#FFFFFF"
      }
    }).then(setQrUrl).catch(console.error);
  }, [studentCode]);

  if (!qrUrl) return <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded-xl"></div>;

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `QR_${name}_${studentCode}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <img src={qrUrl} alt={`QR Code ${name}`} className="rounded-xl shadow-sm border border-gray-100" />
      <button onClick={downloadQR} className="text-sm flex items-center gap-2 text-primary hover:text-primary-hover font-medium bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
        <Download className="w-4 h-4" />
        Download QR
      </button>
    </div>
  );
}
