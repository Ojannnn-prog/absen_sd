"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Users, 
  AlertTriangle, 
  Sparkles, 
  SwitchCamera, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";
import { loadFaceModels, loadFaceApi, calculateFaceSimilarity } from "@/lib/face-api";
import { getClassFaceDescriptors, recordAttendanceByFace } from "@/app/actions/face-actions";

type ScannedStudent = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
  classGroup?: string;
};

type EnrolledStudentData = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
  classGroup?: string;
  descriptor: Float32Array;
  photo?: string | null;
};

type ScanStatus = "idle" | "searching" | "recognizing" | "success" | "already_scanned" | "unknown" | "error";

// Audio chime using Web Audio API (zero external assets needed)
function playAttendanceChime(type: "success" | "already") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "success") {
      // Pleasant chime: C5 -> E5 -> G5
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "already") {
      // Gentle reminder tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(392, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Autoplay restrictions
  }
}

export default function FaceScanner({
  onScanSuccess,
  teacherClassGroup,
}: {
  onScanSuccess: (data: { student: ScannedStudent; timestamp: Date; isNew: boolean }) => void;
  teacherClassGroup?: string;
}) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initMessage, setInitMessage] = useState("Menyiapkan mesin pengenal wajah...");
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [scanStatus, setScanStatus] = useState<ScanStatus>("searching");
  const [identifiedStudent, setIdentifiedStudent] = useState<{
    name: string;
    studentCode: string;
    similarity: number;
  } | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs to avoid unnecessary re-renders and camera teardowns
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missCountRef = useRef(0);
  const statusRef = useRef<ScanStatus>("searching");
  const enrolledStudentsRef = useRef<EnrolledStudentData[]>([]);

  // Keep enrolledStudentsRef synced with state
  useEffect(() => {
    enrolledStudentsRef.current = enrolledStudents;
  }, [enrolledStudents]);

  // Safely update status without jitter
  const updateStatus = useCallback((newStatus: ScanStatus) => {
    if (statusRef.current !== newStatus) {
      statusRef.current = newStatus;
      setScanStatus(newStatus);
    }
  }, []);

  // Fetch enrolled students from server
  const fetchEnrolledStudents = useCallback(async () => {
    try {
      const res = await getClassFaceDescriptors(teacherClassGroup);
      if (res.success && res.students) {
        const parsed: EnrolledStudentData[] = [];

        for (const s of res.students) {
          if (Array.isArray(s.faceDescriptor) && s.faceDescriptor.length === 128) {
            parsed.push({
              id: s.id,
              name: s.name,
              studentCode: s.studentCode,
              gender: s.gender,
              classGroup: s.classGroup || undefined,
              descriptor: new Float32Array(s.faceDescriptor),
              photo: s.facePhoto,
            });
          }
        }

        setEnrolledStudents(parsed);
        return parsed.length;
      }
      return 0;
    } catch (err) {
      console.error("Fetch enrolled error:", err);
      return 0;
    }
  }, [teacherClassGroup]);

  // Start webcam without re-triggering React effect cascades
  const startCamera = useCallback(async (mode: "user" | "environment") => {
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play error:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Camera stream error:", err);
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }, []);

  // Manual refresh of enrolled students
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const count = await fetchEnrolledStudents();
    setIsRefreshing(false);
    toast.success(`${count} wajah siswa terdaftar berhasil dimuat.`);
  };

  // Toggle front/back camera
  const toggleFacingMode = async () => {
    const nextMode = facingModeRef.current === "user" ? "environment" : "user";
    facingModeRef.current = nextMode;
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Run initialization once on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsInitializing(true);
      setInitMessage("Mengunduh model neural network wajah...");

      const modelsOk = await loadFaceModels();
      if (!isMounted) return;

      if (!modelsOk) {
        setCameraError("Gagal memuat model neural network wajah.");
        setIsInitializing(false);
        return;
      }

      setInitMessage("Mengambil data wajah siswa terdaftar...");
      await fetchEnrolledStudents();
      if (!isMounted) return;

      setInitMessage("Menghubungkan kamera...");
      await startCamera(facingModeRef.current);
      if (isMounted) setIsInitializing(false);
    }

    init();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []); // Run exactly once on mount!

  // Face recognition loop with smooth hysteresis
  useEffect(() => {
    if (isInitializing) return;

    const intervalId = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || cooldownRef.current) {
        return;
      }

      try {
        const faceapi = await loadFaceApi();
        if (!faceapi) return;

        // Detect single face with TinyFaceDetector (score threshold 0.35 for smooth recognition)
        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          missCountRef.current += 1;
          // Only switch back to 'searching' if missed for 3 consecutive frames (~900ms)
          if (missCountRef.current >= 3 && statusRef.current !== "success" && statusRef.current !== "already_scanned") {
            updateStatus("searching");
            setIdentifiedStudent(null);
          }
          return;
        }

        // Face detected in frame
        missCountRef.current = 0;
        const currentList = enrolledStudentsRef.current;

        if (currentList.length === 0) {
          updateStatus("searching");
          return;
        }

        const currentDescriptor = detection.descriptor;

        // Find closest match among enrolled students
        let bestMatch: {
          student: EnrolledStudentData;
          distance: number;
          similarityPercent: number;
        } | null = null;

        for (const candidate of currentList) {
          const { distance, similarityPercent, isMatch } = calculateFaceSimilarity(
            currentDescriptor,
            candidate.descriptor
          );

          if (isMatch) {
            if (!bestMatch || distance < bestMatch.distance) {
              bestMatch = { student: candidate, distance, similarityPercent };
            }
          }
        }

        if (bestMatch) {
          const matched = bestMatch.student;
          setIdentifiedStudent({
            name: matched.name,
            studentCode: matched.studentCode,
            similarity: bestMatch.similarityPercent,
          });

          // Prevent rapid multi-triggers for same student
          cooldownRef.current = true;

          // Record attendance via server action
          const res = await recordAttendanceByFace(matched.id);

          if (res.success && res.student) {
            updateStatus("success");
            if (soundEnabled) playAttendanceChime("success");
            toast.success(`${res.student.name} berhasil absen via pemindai wajah!`);

            onScanSuccess({
              student: res.student,
              timestamp: new Date(res.timestamp),
              isNew: true,
            });
          } else if (!res.success && res.student) {
            updateStatus("already_scanned");
            if (soundEnabled) playAttendanceChime("already");
            toast.error(`${res.student.name} sudah absen hari ini.`);

            onScanSuccess({
              student: res.student,
              timestamp: new Date(res.timestamp),
              isNew: false,
            });
          } else {
            updateStatus("error");
            toast.error(res.message || "Gagal mencatat absensi.");
          }

          // Reset cooldown after 3.5 seconds
          cooldownTimerRef.current = setTimeout(() => {
            cooldownRef.current = false;
            updateStatus("searching");
            setIdentifiedStudent(null);
          }, 3500);

        } else {
          // Face found but not in enrolled database
          updateStatus("unknown");
          setIdentifiedStudent(null);
        }
      } catch (err) {
        console.error("Recognition cycle error:", err);
      }
    }, 280);

    return () => {
      clearInterval(intervalId);
    };
  }, [isInitializing, soundEnabled, onScanSuccess, updateStatus]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Card Wrapper */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        
        {/* Top Info Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-bold text-gray-700">
              Face Recognition AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] flex items-center gap-1">
              <Users className="w-3 h-3" />
              {enrolledStudents.length} Wajah Terdaftar
            </span>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
              title="Perbarui Data Wajah Siswa"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              title={soundEnabled ? "Nonaktifkan Suara" : "Aktifkan Suara"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Camera Viewport Area - Zero flicker video */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {/* Video element stays permanently rendered without opacity transitions */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Initializing Overlay */}
          {isInitializing && !cameraError && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 text-white z-10">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="font-bold text-sm">{initMessage}</p>
              <p className="text-xs text-white/60 mt-1">Mohon tunggu beberapa detik...</p>
            </div>
          )}

          {/* Camera Error Overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 text-white z-10">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="font-bold text-sm text-amber-200">{cameraError}</p>
              <button
                onClick={() => startCamera(facingModeRef.current)}
                className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Coba Akses Kamera Lagi
              </button>
            </div>
          )}

          {/* Active Scanner Overlays */}
          {!isInitializing && !cameraError && (
            <>
              {/* Face Target Reticle Overlay with Smooth Class Transitions */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-48 h-60 rounded-[50%] transition-colors duration-200 flex items-center justify-center ${
                    scanStatus === "success"
                      ? "border-4 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                      : scanStatus === "already_scanned"
                      ? "border-4 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                      : scanStatus === "unknown"
                      ? "border-2 border-dashed border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : scanStatus === "recognizing"
                      ? "border-3 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-pulse"
                      : "border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white/50"></div>
                </div>
              </div>

              {/* Camera Switch button */}
              <button
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all z-10 cursor-pointer"
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              {/* Status Banner Overlay */}
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
                {scanStatus === "success" && identifiedStudent && (
                  <div className="bg-green-600/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-lg flex items-center justify-between animate-in zoom-in-95">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white/20 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm leading-tight">{identifiedStudent.name}</p>
                        <p className="text-[11px] text-green-100">
                          {identifiedStudent.studentCode} • Kecocokan: {identifiedStudent.similarity}%
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-white text-green-700 rounded-lg">
                      Hadir
                    </span>
                  </div>
                )}

                {scanStatus === "already_scanned" && identifiedStudent && (
                  <div className="bg-amber-600/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-lg flex items-center justify-between animate-in zoom-in-95">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white/20 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm leading-tight">{identifiedStudent.name}</p>
                        <p className="text-[11px] text-amber-100">Sudah absen hari ini</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-white text-amber-700 rounded-lg">
                      Tercatat
                    </span>
                  </div>
                )}

                {scanStatus === "unknown" && (
                  <div className="bg-red-600/85 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-lg text-center animate-in fade-in">
                    <p className="text-xs font-bold">Wajah terdeteksi namun tidak cocok dengan siswa terdaftar</p>
                  </div>
                )}

                {scanStatus === "searching" && (
                  <div className="bg-black/60 backdrop-blur-md text-white/90 p-2 rounded-xl text-center">
                    <p className="text-xs font-medium">Arahkan wajah siswa ke dalam lingkaran kamera</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Guide / Notice */}
        <div className="p-4 bg-white text-center">
          {enrolledStudents.length === 0 && !isInitializing ? (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs text-left">
              <p className="font-black flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Belum ada data wajah siswa terdaftar
              </p>
              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                Buka menu <b>Data Siswa</b>, lalu klik tombol <b>+ Daftarkan</b> pada siswa untuk merekam wajah via kamera atau upload foto.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Scan Wajah Otomatis
              </span>
              <span>•</span>
              <span>Jarak ideal 0.5 - 1.5 meter</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
