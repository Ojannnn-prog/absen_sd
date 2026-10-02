"use client";

import { useEffect, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  Lightbulb,
  Pencil,
  RotateCcw,
  Sparkles,
  Tags,
  Target,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

type ModuleId = "annotate" | "pattern" | "draw";

type LabProgress = {
  points: number;
  completed: ModuleId[];
  answered: Record<string, boolean>;
  bestDrawing: number;
};

type AnnotationTask = {
  id: string;
  emoji: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

const STORAGE_KEY = "sdn231-ai-lab-progress-v1";

const annotationTasks: AnnotationTask[] = [
  {
    id: "animal-cat",
    emoji: "🐱",
    prompt: "Contoh data ini menunjukkan hewan. Label yang paling sesuai adalah…",
    options: ["Hewan", "Kendaraan", "Makanan"],
    answer: "Hewan",
    explanation: "Label membantu AI mengelompokkan contoh yang memiliki ciri serupa.",
  },
  {
    id: "vehicle-bike",
    emoji: "🚲",
    prompt: "Kita ingin membuat AI mengenali kendaraan. Label yang tepat untuk data ini…",
    options: ["Tumbuhan", "Kendaraan", "Alat musik"],
    answer: "Kendaraan",
    explanation: "Anotasi adalah kegiatan memberi nama atau kategori pada data.",
  },
  {
    id: "food-apple",
    emoji: "🍎",
    prompt: "Agar AI belajar mengenali makanan, data ini sebaiknya diberi label…",
    options: ["Makanan", "Bangunan", "Cuaca"],
    answer: "Makanan",
    explanation: "Semakin rapi dan konsisten labelnya, semakin mudah pola dipelajari.",
  },
];

const initialProgress: LabProgress = {
  points: 0,
  completed: [],
  answered: {},
  bestDrawing: 0,
};

function modulePercent(id: ModuleId, progress: LabProgress) {
  if (progress.completed.includes(id)) return 100;
  if (id === "annotate") {
    return Math.round(
      (annotationTasks.filter(task => progress.answered[task.id]).length / annotationTasks.length) * 100,
    );
  }
  return 0;
}

export default function AiLabClient({ studentName }: { studentName: string }) {
  const [progress, setProgress] = useState<LabProgress>(initialProgress);
  const [activeModule, setActiveModule] = useState<ModuleId>("annotate");
  const [taskIndex, setTaskIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [patternAnswer, setPatternAnswer] = useState<string | null>(null);
  const [drawFeedback, setDrawFeedback] = useState<{ title: string; body: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<LabProgress>;
        const savedProgress: LabProgress = {
          points: typeof parsed.points === "number" ? parsed.points : 0,
          completed: Array.isArray(parsed.completed) ? parsed.completed.filter(Boolean) as ModuleId[] : [],
          answered: parsed.answered && typeof parsed.answered === "object" ? parsed.answered : {},
          bestDrawing: typeof parsed.bestDrawing === "number" ? parsed.bestDrawing : 0,
        };
        loadTimer = setTimeout(() => setProgress(savedProgress), 0);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      loadTimer = setTimeout(() => setHydrated(true), 0);
    }
    return () => {
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.width, rect.height);
      context.strokeStyle = "#4f46e5";
      context.lineWidth = 6;
      context.lineCap = "round";
      context.lineJoin = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [activeModule]);

  const currentTask = annotationTasks[taskIndex];
  const completedCount = progress.completed.length;
  const level = Math.max(1, Math.floor(progress.points / 50) + 1);

  const completeModule = (moduleId: ModuleId, bonus: number) => {
    setProgress(previous => {
      if (previous.completed.includes(moduleId)) return previous;
      return {
        ...previous,
        points: previous.points + bonus,
        completed: [...previous.completed, moduleId],
      };
    });
  };

  const chooseAnnotation = (answer: string) => {
    if (selectedAnswer || !currentTask) return;
    const isCorrect = answer === currentTask.answer;
    setSelectedAnswer(answer);

    if (isCorrect && !progress.answered[currentTask.id]) {
      setProgress(previous => ({
        ...previous,
        points: previous.points + 10,
        answered: { ...previous.answered, [currentTask.id]: true },
      }));
      toast.success("Benar! +10 poin");
    } else if (!isCorrect) {
      toast.error("Belum tepat. Perhatikan penjelasannya, lalu coba lagi di tantangan berikutnya.");
    }
  };

  const nextAnnotation = () => {
    if (taskIndex < annotationTasks.length - 1) {
      setTaskIndex(index => index + 1);
      setSelectedAnswer(null);
      return;
    }

    completeModule("annotate", 25);
    setSelectedAnswer(null);
    setActiveModule("pattern");
    toast.success("Modul anotasi selesai! Bonus +25 poin", { icon: "🏅" });
  };

  const answerPattern = (answer: string) => {
    if (patternAnswer) return;
    setPatternAnswer(answer);
    if (answer === "ciri") {
      setProgress(previous => ({ ...previous, points: previous.points + 15 }));
      toast.success("Tepat! +15 poin");
      completeModule("pattern", 25);
    } else {
      toast.error("Coba pikirkan apa yang dapat dibandingkan dari data.");
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    if (!point) return;
    drawingRef.current = true;
    pointsRef.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext("2d");
    context?.beginPath();
    context?.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    pointsRef.current.push(point);
    const context = event.currentTarget.getContext("2d");
    context?.lineTo(point.x, point.y);
    context?.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    pointsRef.current = [];
    setDrawFeedback(null);
  };

  const predictDrawing = () => {
    const points = pointsRef.current;
    if (points.length < 4) {
      setDrawFeedback({
        title: "Datanya belum cukup",
        body: "Buat beberapa goresan dulu. AI perlu contoh data agar dapat membaca pola.",
      });
      return;
    }

    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const score = Math.min(100, 40 + Math.round(Math.min(points.length / 3, 40)));
    const shapeHint = width > height * 1.4
      ? "goresan melebar"
      : height > width * 1.4
        ? "goresan memanjang"
        : "goresan yang relatif seimbang";

    setProgress(previous => ({
      ...previous,
      points: previous.points + (score > previous.bestDrawing ? 10 : 3),
      bestDrawing: Math.max(previous.bestDrawing, score),
    }));
    setDrawFeedback({
      title: `Prediksi simulasi: ${shapeHint}`,
      body: `AI membaca ${points.length} titik data dan ukuran kotak gambar. Skor kepercayaan simulasi: ${score}%. Ini contoh sederhana bahwa AI mengambil ciri dari data sebelum membuat prediksi.`,
    });
  };

  const resetProgress = () => {
    setProgress(initialProgress);
    setTaskIndex(0);
    setSelectedAnswer(null);
    setPatternAnswer(null);
    setDrawFeedback(null);
    clearDrawing();
    toast.success("Progress Lab Maya direset di perangkat ini.");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-16">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-5 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Lab Maya
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Halo, {studentName}!</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Belajar bagaimana AI membaca data, memberi label, menemukan pola, dan membuat prediksi melalui permainan singkat.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm"><Trophy className="mx-auto mb-1 h-5 w-5" /><strong className="block text-xl">{progress.points}</strong><span className="text-[10px] font-bold uppercase">Poin</span></div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm"><Target className="mx-auto mb-1 h-5 w-5" /><strong className="block text-xl">Lv. {level}</strong><span className="text-[10px] font-bold uppercase">Level</span></div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm"><Flame className="mx-auto mb-1 h-5 w-5" /><strong className="block text-xl">{completedCount}/3</strong><span className="text-[10px] font-bold uppercase">Selesai</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { id: "annotate" as ModuleId, icon: Tags, title: "Labelkan Data", description: "Kenali anotasi dan label." },
          { id: "pattern" as ModuleId, icon: Brain, title: "Cari Pola", description: "Lihat cara AI membandingkan ciri." },
          { id: "draw" as ModuleId, icon: Pencil, title: "QuickDraw Mini", description: "Gambar dan baca ciri sederhana." },
        ].map(module => {
          const Icon = module.icon;
          const percent = modulePercent(module.id, progress);
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`rounded-2xl border p-4 text-left transition-all active:scale-[.98] ${activeModule === module.id ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-100 bg-white hover:border-indigo-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${activeModule === module.id ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"}`}><Icon className="h-5 w-5" /></span>
                {percent === 100 && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <h2 className="mt-4 font-black text-gray-900">{module.title}</h2>
              <p className="mt-1 text-xs text-gray-500">{module.description}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} /></div>
              <p className="mt-2 text-[11px] font-bold text-indigo-600">{percent}% selesai</p>
            </button>
          );
        })}
      </section>

      {activeModule === "annotate" && currentTask && (
        <section className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-widest text-indigo-500">Misi 1 · Anotasi Data</p><h2 className="mt-2 text-2xl font-black text-gray-900">Beri label yang tepat</h2></div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">{taskIndex + 1}/{annotationTasks.length}</span>
          </div>
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-amber-50 to-indigo-50 p-6 text-center"><div className="text-7xl" role="img" aria-label="Contoh data">{currentTask.emoji}</div><p className="mx-auto mt-5 max-w-xl text-base font-bold leading-7 text-gray-700">{currentTask.prompt}</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{currentTask.options.map(option => { const correct = option === currentTask.answer; const selected = option === selectedAnswer; return <button key={option} onClick={() => chooseAnnotation(option)} className={`min-h-12 rounded-2xl border-2 px-4 py-3 text-sm font-black transition-all ${selected ? correct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-100 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"}`}>{option}</button>; })}</div>
          {selectedAnswer && <div className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${selectedAnswer === currentTask.answer ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}><strong>{selectedAnswer === currentTask.answer ? "Hebat! " : "Belum tepat. "}</strong>{currentTask.explanation}<button onClick={nextAnnotation} className="mt-3 flex items-center gap-1 font-black text-indigo-600">{taskIndex === annotationTasks.length - 1 ? "Selesaikan modul" : "Tantangan berikutnya"}<ChevronRight className="h-4 w-4" /></button></div>}
        </section>
      )}

      {activeModule === "pattern" && (
        <section className="rounded-[2rem] border border-violet-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-violet-500">Misi 2 · Cara AI Belajar</p><h2 className="mt-2 text-2xl font-black text-gray-900">Ciri apa yang bisa dibandingkan?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-3xl bg-violet-50 p-6 text-center"><div className="text-6xl">🐟</div><p className="mt-3 text-sm font-bold text-violet-900">Data A</p></div><div className="rounded-3xl bg-sky-50 p-6 text-center"><div className="text-6xl">🐬</div><p className="mt-3 text-sm font-bold text-sky-900">Data B</p></div></div>
          <p className="mt-6 text-base font-bold leading-7 text-gray-700">Saat belajar, AI mencari ciri dari banyak contoh. Mana yang paling berguna untuk membandingkan dua data?</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{[["warna", "Warna"], ["ciri", "Bentuk tubuh"], ["nama", "Nama panggilan"]].map(([id, label]) => <button key={id} onClick={() => answerPattern(id)} className={`min-h-12 rounded-2xl border-2 px-4 py-3 text-sm font-black ${patternAnswer === id ? id === "ciri" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-400 bg-rose-50 text-rose-700" : "border-gray-100 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50"}`}>{label}</button>)}</div>
          {patternAnswer && <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-900"><strong>{patternAnswer === "ciri" ? "Benar! " : "Belum tepat. "}</strong>AI tidak memahami nama seperti manusia. AI memanfaatkan ciri yang dapat diukur dari contoh data. Setelah banyak contoh, pola itu digunakan untuk membuat prediksi.</div>}
        </section>
      )}

      {activeModule === "draw" && (
        <section className="rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-amber-500">Misi 3 · QuickDraw Mini</p><h2 className="mt-2 text-2xl font-black text-gray-900">Buat beberapa goresan</h2></div><span className="text-xs font-bold text-gray-500">Gambar bebas, ini hanya simulasi aman.</span></div>
          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-dashed border-amber-200 bg-white"><canvas ref={canvasRef} className="h-72 w-full touch-none" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} aria-label="Area menggambar untuk Lab Maya" /></div>
          <div className="mt-4 flex flex-wrap gap-3"><button onClick={predictDrawing} className="flex min-h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"><Lightbulb className="h-4 w-4" />Baca pola</button><button onClick={clearDrawing} className="flex min-h-11 items-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-black text-gray-700"><RotateCcw className="h-4 w-4" />Hapus gambar</button></div>
          {drawFeedback && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>{drawFeedback.title}</strong><p className="mt-1">{drawFeedback.body}</p></div>}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-gray-500">Progress Lab Maya tersimpan di perangkat ini dan tidak mengirim gambar pribadi ke server.</p><button onClick={resetProgress} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100"><RotateCcw className="h-4 w-4" />Reset progress</button></section>
    </div>
  );
}
