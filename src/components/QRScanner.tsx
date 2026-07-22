"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, SwitchCamera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type ScannedStudent = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
};

type ScanStatus = "idle" | "loading" | "success" | "already_scanned" | "error";

export default function QRScanner({
  onScanSuccess
}: {
  onScanSuccess: (data: { student: ScannedStudent, timestamp: Date, isNew: boolean }) => void
}) {
  const [hasCameras, setHasCameras] = useState(false);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [lastScannedName, setLastScannedName] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  // Initialize and check for cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setHasCameras(true);
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          // Try to select a back camera by default
          const backCam = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("belakang") || d.label.toLowerCase().includes("environment"));
          if (backCam) {
            setActiveCameraId(backCam.id);
          } else {
            setActiveCameraId(devices[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        toast.error("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.");
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;

    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader", {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
      }

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (cooldownRef.current) return;
          
          cooldownRef.current = true;
          setScanStatus("loading");
          
          try {
            // Panggil API (Server Action) untuk memproses absensi
            const { recordAttendance } = await import("@/app/admin/scanner/actions");
            const result = await recordAttendance(decodedText);
            
            if (result.success && result.student) {
              setScanStatus("success");
              setLastScannedName(result.student.name);
              toast.success(`${result.student.name} berhasil absen!`);
              
              // Callback ke parent untuk update UI daftar recent
              onScanSuccess({
                student: result.student,
                timestamp: result.timestamp,
                isNew: true
              });
              
            } else if (!result.success && result.student) {
              // Sudah absen
              setScanStatus("already_scanned");
              setLastScannedName(result.student.name);
              toast.error(`${result.student.name} sudah absen hari ini.`);
              
              // Callback ke parent (isNew: false)
              onScanSuccess({
                student: result.student,
                timestamp: result.timestamp,
                isNew: false
              });
            } else {
              setScanStatus("error");
              setLastScannedName("Siswa Tidak Dikenal");
              toast.error(result.message || "QR Code tidak valid.");
            }
          } catch (error) {
            setScanStatus("error");
            toast.error("Terjadi kesalahan jaringan.");
          }

          // Cooldown 3 detik sebelum bisa scan lagi
          setTimeout(() => {
            setScanStatus("idle");
            cooldownRef.current = false;
          }, 3000);
        },
        (errorMessage) => {
          // Ignored. html5-qrcode spam warnings when no QR is found in frame.
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      toast.error("Gagal memulai kamera.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
      setScanStatus("idle");
    }
  };

  const toggleCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setActiveCameraId(nextCameraId);
    
    if (isScanning) {
      startScanner(nextCameraId);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Scanner Viewport */}
      <div className="w-full relative rounded-3xl overflow-hidden bg-gray-900 shadow-2xl border-4 border-gray-800 aspect-square flex items-center justify-center">
        
        {/* The div where html5-qrcode renders the video */}
        <div id="qr-reader" className="w-full h-full object-cover [&>video]:object-cover" />

        {/* Overlay when idle */}
        {!isScanning && (
          <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center text-white z-10">
            <Camera className="w-12 h-12 mb-4 text-gray-400" />
            <p className="font-medium text-gray-300">Kamera dinonaktifkan</p>
            <button 
              onClick={() => startScanner(activeCameraId)}
              className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover rounded-full font-bold transition-colors shadow-lg shadow-primary/20"
            >
              Nyalakan Pemindai
            </button>
          </div>
        )}

        {/* Scan Feedback Overlay */}
        {scanStatus !== "idle" && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all duration-300 ${
            scanStatus === "loading" ? "bg-gray-900/60" :
            scanStatus === "success" ? "bg-green-500/80" :
            scanStatus === "already_scanned" ? "bg-orange-500/80" : "bg-red-500/80"
          }`}>
            {scanStatus === "loading" && <Loader2 className="w-16 h-16 animate-spin" />}
            {scanStatus === "success" && (
              <>
                <CheckCircle2 className="w-20 h-20 mb-4 animate-in zoom-in" />
                <h3 className="text-2xl font-bold text-center px-4 leading-tight">{lastScannedName}</h3>
                <p className="mt-2 font-medium bg-white/20 px-4 py-1 rounded-full">Berhasil Absen</p>
              </>
            )}
            {scanStatus === "already_scanned" && (
              <>
                <CheckCircle2 className="w-16 h-16 mb-4 animate-in zoom-in" />
                <h3 className="text-xl font-bold text-center px-4">{lastScannedName}</h3>
                <p className="mt-2 font-medium bg-white/20 px-4 py-1 rounded-full text-sm">Sudah absen hari ini</p>
              </>
            )}
            {scanStatus === "error" && (
              <>
                <XCircle className="w-16 h-16 mb-4 animate-in zoom-in" />
                <h3 className="text-xl font-bold text-center px-4">Gagal</h3>
                <p className="mt-2 font-medium bg-white/20 px-4 py-1 rounded-full text-sm">QR Code tidak valid</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {isScanning && (
        <div className="flex gap-4 mt-8">
          <button 
            onClick={stopScanner}
            className="px-6 py-3 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-full transition-colors flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Matikan
          </button>
          
          {cameras.length > 1 && (
            <button 
              onClick={toggleCamera}
              className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-full transition-colors flex items-center gap-2"
            >
              <SwitchCamera className="w-5 h-5" />
              Putar Kamera
            </button>
          )}
        </div>
      )}
    </div>
  );
}
