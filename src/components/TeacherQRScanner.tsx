"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, SwitchCamera, Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { recordAttendanceByTeacher } from "@/app/teacher/scanner/actions";

type ScannedStudent = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
  classGroup?: string;
};

type ScanStatus = "idle" | "loading" | "success" | "already_scanned" | "error";

export default function TeacherQRScanner({
  onScanSuccess,
  teacherClassGroup
}: {
  onScanSuccess: (data: { student: ScannedStudent, timestamp: Date, isNew: boolean }) => void;
  teacherClassGroup: string;
}) {
  const [hasCameras, setHasCameras] = useState(false);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [lastScannedName, setLastScannedName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setHasCameras(true);
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
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

  const startScanner = async () => {
    if (!activeCameraId) return;

    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        activeCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (cooldownRef.current) return;
          
          cooldownRef.current = true;
          setScanStatus("loading");
          setErrorMessage("");
          
          try {
            const result = await recordAttendanceByTeacher(decodedText);
            
            if (result.success && result.student) {
              setScanStatus("success");
              setLastScannedName(result.student.name);
              toast.success(`${result.student.name} berhasil absen di Kelas 6${teacherClassGroup}!`);
              
              onScanSuccess({
                student: result.student,
                timestamp: result.timestamp,
                isNew: true
              });
            } else if (!result.success && result.student) {
              setScanStatus("already_scanned");
              setLastScannedName(result.student.name);
              toast.error(`${result.student.name} sudah absen hari ini.`);
              
              onScanSuccess({
                student: result.student,
                timestamp: result.timestamp,
                isNew: false
              });
            } else {
              setScanStatus("error");
              setLastScannedName("Akses Ditolak");
              setErrorMessage(result.message || "QR Code tidak valid.");
              toast.error(result.message || "QR Code tidak valid.");
            }
          } catch (error) {
            setScanStatus("error");
            setErrorMessage("Terjadi kesalahan jaringan.");
            toast.error("Terjadi kesalahan jaringan.");
          }

          setTimeout(() => {
            setScanStatus("idle");
            cooldownRef.current = false;
          }, 3000);
        },
        (errorMessage) => {
          // diabaikan
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      toast.error("Gagal memulai scanner.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
    if (isScanning) {
      stopScanner().then(() => {
        setTimeout(startScanner, 300);
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Container Scanner */}
      <div className="w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-gray-800 aspect-square flex flex-col items-center justify-center">
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-white font-bold text-lg">Scanner Absensi Guru (Kelas 6{teacherClassGroup})</h3>
            <p className="text-gray-400 text-xs mt-1 mb-6 max-w-xs">
              Hanya siswa dari Kelas 6{teacherClassGroup} yang dapat absen dengan scanner ini.
            </p>
            {hasCameras ? (
              <button
                onClick={startScanner}
                className="btn-primary bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl font-bold text-sm"
              >
                Aktifkan Kamera Scanner
              </button>
            ) : (
              <p className="text-red-400 text-sm font-semibold">Kamera tidak ditemukan di perangkat ini.</p>
            )}
          </div>
        )}

        <div id="reader" className="w-full h-full object-cover"></div>

        {/* Overlay Status */}
        {scanStatus !== "idle" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/85 backdrop-blur-sm p-6 text-center animate-in fade-in duration-200">
            {scanStatus === "loading" && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-3" />
                <p className="text-white font-bold">Memvalidasi QR Code Siswa...</p>
              </>
            )}

            {scanStatus === "success" && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-3 animate-bounce" />
                <p className="text-green-400 font-extrabold text-xl">{lastScannedName}</p>
                <p className="text-white text-sm mt-1 font-semibold">Berhasil Absen di Kelas 6{teacherClassGroup}!</p>
              </>
            )}

            {scanStatus === "already_scanned" && (
              <>
                <CheckCircle2 className="w-16 h-16 text-amber-500 mb-3" />
                <p className="text-amber-400 font-extrabold text-xl">{lastScannedName}</p>
                <p className="text-white text-sm mt-1 font-semibold">Sudah Melakukan Absensi Hari Ini</p>
              </>
            )}

            {scanStatus === "error" && (
              <>
                <ShieldAlert className="w-16 h-16 text-red-500 mb-3" />
                <p className="text-red-400 font-extrabold text-xl">{lastScannedName}</p>
                <p className="text-white text-sm mt-1 font-semibold">{errorMessage || "QR Code tidak valid untuk kelas ini"}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Control buttons */}
      {isScanning && (
        <div className="flex items-center justify-between w-full mt-4 px-2">
          <button
            onClick={stopScanner}
            className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
          >
            Matikan Scanner
          </button>
          
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="btn btn-secondary text-xs flex items-center gap-2"
            >
              <SwitchCamera className="w-4 h-4" />
              Ganti Kamera
            </button>
          )}
        </div>
      )}
    </div>
  );
}
