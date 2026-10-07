"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Sparkles,
  SwitchCamera,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { loadFaceModels, loadFaceApi, extractFaceDescriptor, createFaceThumbnail } from "@/lib/face-api";
import { enrollStudentFace, deleteStudentFace } from "@/app/actions/face-actions";

interface StudentFaceData {
  id: string;
  name: string;
  studentCode: string;
  classGroup?: string;
  facePhoto?: string | null;
  faceEnrolledAt?: string | Date | null;
}

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentFaceData | null;
  onSuccess: (studentId: string, photoBase64: string, enrolledAt: Date) => void;
  onDeleteSuccess?: (studentId: string) => void;
}

export default function FaceEnrollmentModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  onDeleteSuccess,
}: FaceEnrollmentModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Camera state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveFaceDetected, setLiveFaceDetected] = useState(false);

  // Analysis result
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [extractedDescriptor, setExtractedDescriptor] = useState<number[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const detectionLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
  }, []);

  // Start camera
  const startCamera = useCallback(async (mode: "user" | "environment" = facingModeRef.current) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }, []);

  // Initialize models when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPreviewPhoto(null);
      setExtractedDescriptor(null);
      setStatusType("idle");
      setStatusMessage("");
      setLiveFaceDetected(false);
      return;
    }

    let isMounted = true;
    setIsModelsLoading(true);

    loadFaceModels().then((loaded) => {
      if (!isMounted) return;
      setIsModelsLoading(false);
      if (!loaded) {
        toast.error("Gagal memuat model neural network wajah. Periksa koneksi.");
      } else if (activeTab === "camera") {
        startCamera(facingModeRef.current);
      }
    });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Handle camera switch toggle
  const toggleCameraFacing = async () => {
    const nextMode = facingModeRef.current === "user" ? "environment" : "user";
    facingModeRef.current = nextMode;
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Live face detection feedback on video
  useEffect(() => {
    if (!isOpen || activeTab !== "camera" || !cameraStream || isModelsLoading) {
      return;
    }

    detectionLoopRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const faceapi = await loadFaceApi();
        if (!faceapi) return;

        const hasFace = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
        );

        setLiveFaceDetected(!!hasFace);
      } catch (e) {
        // Silent error during live preview
      }
    }, 250);

    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
    };
  }, [isOpen, activeTab, cameraStream, isModelsLoading]);

  // Capture from live video feed
  const captureFromCamera = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      toast.error("Kamera belum siap.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Menganalisis wajah...");
    setStatusType("idle");

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context null");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = await extractFaceDescriptor(canvas);

      if (!result) {
        setStatusType("error");
        setStatusMessage("Wajah tidak terdeteksi! Pastikan wajah terlihat jelas dan pencahayaan cukup.");
        toast.error("Wajah tidak terdeteksi. Silakan coba lagi.");
        setIsProcessing(false);
        return;
      }

      const thumbnail = createFaceThumbnail(result.canvas, result.detectionBox);
      setExtractedDescriptor(result.descriptor);
      setPreviewPhoto(thumbnail);
      setStatusType("success");
      setStatusMessage("Wajah berhasil dipindai! Klik tombol 'Simpan & Daftarkan Wajah' di bawah.");
      toast.success("Wajah berhasil dipindai!");
    } catch (err) {
      console.error("Capture analysis error:", err);
      setStatusType("error");
      setStatusMessage("Terjadi kesalahan saat memproses gambar.");
      toast.error("Gagal menganalisis wajah.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle photo file upload with robust multi-stage detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Menganalisis foto unggahan dengan AI...");
    setStatusType("idle");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await extractFaceDescriptor(img);

            if (!result) {
              setStatusType("error");
              setStatusMessage("Wajah tidak terdeteksi pada foto ini! Harap pilih foto portrait wajah siswa yang jelas menghadap kamera.");
              toast.error("Wajah tidak terdeteksi pada foto.");
              setIsProcessing(false);
              return;
            }

            const thumbnail = createFaceThumbnail(result.canvas, result.detectionBox);
            setExtractedDescriptor(result.descriptor);
            setPreviewPhoto(thumbnail);
            setStatusType("success");
            setStatusMessage("Wajah berhasil dikenali & 128 fitur vektor diekstrak! Klik tombol 'Simpan & Daftarkan Wajah'.");
            toast.success("Foto wajah berhasil diverifikasi!");
          } catch (analysisErr) {
            console.error("Analysis inner error:", analysisErr);
            setStatusType("error");
            setStatusMessage("Gagal mengekstrak fitur wajah dari foto.");
          } finally {
            setIsProcessing(false);
          }
        };

        img.onerror = () => {
          setStatusType("error");
          setStatusMessage("Gagal memuat file foto.");
          setIsProcessing(false);
        };

        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload analysis error:", err);
      setStatusType("error");
      setStatusMessage("Gagal membaca file foto.");
      setIsProcessing(false);
    }
  };

  // Save face to database
  const handleSaveFace = async () => {
    if (!student || !extractedDescriptor || !previewPhoto) {
      toast.error("Data wajah belum lengkap.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await enrollStudentFace(student.id, extractedDescriptor, previewPhoto);
      if (res.success) {
        toast.success(res.message);
        onSuccess(student.id, previewPhoto, new Date());
        onClose();
      } else {
        toast.error(res.message || "Gagal menyimpan wajah.");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Terjadi kesalahan saat menyimpan wajah.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete existing face
  const handleDeleteFace = async () => {
    if (!student) return;
    if (!confirm(`Hapus data pemindai wajah untuk ${student.name}? Siswa ini tidak akan bisa absen lewat scan wajah sampai didaftarkan kembali.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteStudentFace(student.id);
      if (res.success) {
        toast.success(res.message);
        if (onDeleteSuccess) onDeleteSuccess(student.id);
        onClose();
      } else {
        toast.error(res.message || "Gagal menghapus.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Gagal menghapus data wajah.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Pendaftaran Wajah Siswa</h2>
              <p className="text-xs text-gray-500 font-medium">
                {student.name} ({student.studentCode}) {student.classGroup ? `• Kelas 6${student.classGroup}` : ""}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing face notice */}
        {student.facePhoto && (
          <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img 
                src={student.facePhoto} 
                alt="Wajah terdaftar" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-300 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-amber-900">Wajah sudah terdaftar sebelumnya</p>
                <p className="text-[11px] text-amber-700">
                  {student.faceEnrolledAt 
                    ? `Terdaftar: ${new Date(student.faceEnrolledAt).toLocaleDateString("id-ID")}` 
                    : "Siap digunakan untuk absensi"}
                </p>
              </div>
            </div>
            <button
              onClick={handleDeleteFace}
              disabled={isDeleting}
              className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-red-200"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Hapus Wajah
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 p-2 gap-2">
          <button
            onClick={() => {
              setActiveTab("camera");
              setPreviewPhoto(null);
              setExtractedDescriptor(null);
              setStatusType("idle");
              setStatusMessage("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "camera"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <Camera className="w-4 h-4" />
            Gunakan Kamera Langsung
          </button>
          <button
            onClick={() => {
              setActiveTab("upload");
              setPreviewPhoto(null);
              setExtractedDescriptor(null);
              setStatusType("idle");
              setStatusMessage("");
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "upload"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah Foto dari Galeri
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === "camera" ? (
            <div className="space-y-4">
              {/* Camera Preview Area - Always mounted */}
              <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-200">
                {/* The video element remains in the DOM */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraStream && !isModelsLoading ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Loading overlay when models or camera are initializing */}
                {(isModelsLoading || !cameraStream) && !cameraError && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 text-white z-10">
                    <Loader2 className="w-9 h-9 text-indigo-400 animate-spin mb-3" />
                    <p className="font-bold text-sm">Menyiapkan Kamera & Model AI...</p>
                    <p className="text-xs text-white/60 mt-1">Mengunduh neural network detektor wajah...</p>
                  </div>
                )}

                {/* Error overlay */}
                {cameraError && (
                  <div className="absolute inset-0 bg-black/95 p-6 flex flex-col items-center justify-center text-center text-white z-10">
                    <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                    <p className="text-sm font-semibold">{cameraError}</p>
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors"
                    >
                      Coba Akses Kamera Lagi
                    </button>
                  </div>
                )}

                {/* Face Guide Oval with Real-time detection feedback */}
                {cameraStream && !isModelsLoading && (
                  <>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div
                        className={`w-48 h-60 rounded-[50%] transition-all duration-300 flex items-center justify-center ${
                          liveFaceDetected
                            ? "border-4 border-green-400 shadow-[0_0_25px_rgba(74,222,128,0.7)]"
                            : "border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                        }`}
                      >
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all shadow-md ${
                            liveFaceDetected
                              ? "bg-green-500 text-white"
                              : "bg-black/60 text-white/90"
                          }`}
                        >
                          {liveFaceDetected ? "✓ Wajah Terdeteksi" : "Posisikan Wajah Di Sini"}
                        </span>
                      </div>
                    </div>

                    {/* Camera Switch button */}
                    <button
                      onClick={toggleCameraFacing}
                      className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all z-10"
                      title="Balik Kamera Depan / Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={captureFromCamera}
                disabled={isProcessing || isModelsLoading || !cameraStream || !!cameraError}
                className={`w-full py-3.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  liveFaceDetected
                    ? "bg-green-600 hover:bg-green-700 shadow-green-600/30 ring-2 ring-green-400 ring-offset-2"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 disabled:opacity-50"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses & Memindai Wajah...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    {liveFaceDetected ? "Ambil Foto Sekarang (Wajah Terdeteksi)" : "Ambil Foto & Analisis Wajah"}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center"
              >
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-bold text-sm text-gray-800">Klik untuk memilih foto wajah</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Gunakan foto portrait siswa yang jelas menghadap kamera (JPG, PNG, WebP).
                </p>
              </div>
            </div>
          )}

          {/* Status Feedback */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                statusType === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : statusType === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {statusType === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : statusType === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Verification / Preview Section */}
          {previewPhoto && extractedDescriptor && (
            <div className="p-4 bg-green-50/80 rounded-2xl border-2 border-green-300 flex items-center gap-4 animate-in slide-in-from-bottom-2 shadow-sm">
              <div className="relative">
                <img
                  src={previewPhoto}
                  alt="Hasil Deteksi"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-green-500 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-green-500 text-white rounded-full">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-green-200 text-green-800">
                    Wajah Siap Didaftarkan
                  </span>
                </div>
                <h4 className="text-sm font-black text-gray-900 mt-1">{student.name}</h4>
                <p className="text-xs text-green-800 font-medium mt-0.5">
                  128 fitur vektor wajah berhasil diekstrak. Klik tombol simpan di bawah untuk mendaftarkan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-200/60 transition-colors"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={handleSaveFace}
            disabled={!extractedDescriptor || !previewPhoto || isSaving}
            className={`px-6 py-3 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              extractedDescriptor && previewPhoto
                ? "bg-green-600 hover:bg-green-700 shadow-green-600/30 ring-2 ring-green-400 ring-offset-2 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-indigo-600/20"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan Wajah ke Database...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Simpan & Daftarkan Wajah Siswa
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
