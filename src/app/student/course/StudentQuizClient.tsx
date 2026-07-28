"use client";

import { useState, useEffect } from "react";
import { submitQuiz } from "./actions";
import toast from "react-hot-toast";
import { Timer, CheckCircle2, XCircle, RefreshCcw, ArrowRight, Loader2, Award, PlayCircle } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function StudentQuizClient({ 
  resource, 
  attempts,
  onNext
}: { 
  resource: any; 
  attempts: any[];
  onNext?: () => void;
}) {
  const latestAttempt = attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  useEffect(() => {
    if (!isStarted || isSubmitting) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, isSubmitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (qId: string, option: string) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < resource.questions.length) {
      setShowIncompleteModal(true);
      return;
    }
    await executeSubmitQuiz();
  };

  const executeSubmitQuiz = async () => {
    setShowIncompleteModal(false);
    setIsSubmitting(true);
    toast.loading("Memeriksa jawaban...", { id: "quiz" });
    try {
      const res = await submitQuiz(resource.id, answers);
      if (res.success) {
        toast.success(res.passed ? "Selamat, Anda Lulus!" : "Belum Lulus, ayo coba lagi!", { id: "quiz" });
        setIsStarted(false);
      } else {
        toast.error(res.message || "Gagal mengirim jawaban", { id: "quiz" });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem", { id: "quiz" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = () => {
    setAnswers({});
    setTimeLeft(1800);
    setIsStarted(true);
  };

  if (!isStarted && latestAttempt) {
    const passed = latestAttempt.passed;
    return (
      <div className="flex flex-col gap-6">
        <div className={`card-soft p-8 text-center flex flex-col items-center justify-center border-2 ${passed ? 'border-green-500/30 bg-green-50/30' : 'border-red-500/30 bg-red-50/30'}`}>
          {passed ? (
            <Award className="w-20 h-20 text-green-500 mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mb-4" />
          )}
          <h2 className="text-3xl font-black text-gray-900 mb-2">Nilai Anda: {latestAttempt.score}</h2>
          <p className="text-gray-600 font-medium mb-6">
            {passed ? "Luar biasa! Anda telah melampaui KKM (60) dan dinyatakan LULUS." : "Jangan menyerah! Nilai Anda masih di bawah KKM (60). Silakan pelajari letak kesalahan Anda dan coba lagi."}
          </p>
          
          <div className="flex gap-4">
            {!passed && (
              <button 
                onClick={startQuiz}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                <RefreshCcw className="w-5 h-5" /> Ulangi Ujian
              </button>
            )}
            {passed && onNext && (
              <button 
                onClick={onNext}
                className="px-6 py-3 bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                Lanjut Materi Berikutnya <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="card-soft p-6 bg-white">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[var(--theme-primary,var(--color-primary))]" /> 
            Kunci Jawaban & Refleksi
          </h3>
          <div className="flex flex-col gap-6">
            {resource.questions.map((q: any, i: number) => (
              <div key={q.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <p className="font-bold text-gray-800 mb-3">{i + 1}. {q.text}</p>
                <div className="flex flex-col gap-2 pl-4">
                  <div className={`p-2 rounded-xl flex items-center gap-2 ${q.correctAnswer === 'A' ? 'bg-green-100 font-bold text-green-800' : 'text-gray-500'}`}>
                    <span className="w-6 font-black">A.</span> {q.optionA} {q.correctAnswer === 'A' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className={`p-2 rounded-xl flex items-center gap-2 ${q.correctAnswer === 'B' ? 'bg-green-100 font-bold text-green-800' : 'text-gray-500'}`}>
                    <span className="w-6 font-black">B.</span> {q.optionB} {q.correctAnswer === 'B' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className={`p-2 rounded-xl flex items-center gap-2 ${q.correctAnswer === 'C' ? 'bg-green-100 font-bold text-green-800' : 'text-gray-500'}`}>
                    <span className="w-6 font-black">C.</span> {q.optionC} {q.correctAnswer === 'C' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="card-soft p-8 text-center flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-white to-blue-50/50">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{resource.title}</h2>
        <p className="text-gray-500 mb-8 max-w-lg">
          Ujian ini terdiri dari {resource.questions?.length || 0} soal pilihan ganda. Anda memiliki waktu 30 menit untuk menyelesaikannya. Nilai KKM untuk lulus adalah 60.
        </p>
        <button 
          onClick={startQuiz}
          disabled={!resource.questions || resource.questions.length === 0}
          className="px-8 py-4 bg-[var(--theme-primary,var(--color-primary))] hover:opacity-90 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-[var(--theme-primary,var(--color-primary))]/30 transition-all transform hover:-translate-y-1 disabled:opacity-50"
        >
          <PlayCircle className="w-6 h-6" /> Mulai Ujian Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card-soft p-4 bg-white sticky top-20 z-20 flex justify-between items-center shadow-lg border-2 border-[var(--theme-primary,var(--color-primary))]/20">
        <h3 className="font-bold text-gray-800">Ujian Berlangsung</h3>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="card-soft p-6 md:p-8 bg-white flex flex-col gap-8">
        {resource.questions.map((q: any, i: number) => (
          <div key={q.id} className="flex flex-col gap-4 pb-8 border-b border-gray-100 last:border-0 last:pb-0">
            <h4 className="text-xl font-bold text-gray-900">
              <span className="text-[var(--theme-primary,var(--color-primary))] mr-2">{i + 1}.</span> 
              {q.text}
            </h4>
            <div className="flex flex-col gap-3 pl-2 md:pl-6">
              {['A', 'B', 'C'].map((opt) => {
                const optText = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : q.optionC;
                const isSelected = answers[q.id] === opt;
                return (
                  <label 
                    key={opt}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[var(--theme-primary,var(--color-primary))] bg-[var(--theme-primary,var(--color-primary))]/5 shadow-sm' 
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(q.id, opt)}
                      className="w-5 h-5 text-[var(--theme-primary,var(--color-primary))] focus:ring-[var(--theme-primary,var(--color-primary))]"
                    />
                    <span className="font-bold text-gray-700">{opt}.</span>
                    <span className="text-gray-600">{optText}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-6 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl shadow-green-500/30 transition-all transform hover:-translate-y-1"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            Kirim Jawaban
          </button>
        </div>
      </div>

      {/* Incomplete Quiz Confirm Modal */}
      <ConfirmModal
        isOpen={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        onConfirm={executeSubmitQuiz}
        title="Kirim Jawaban Kuis?"
        message="Masih ada soal yang belum Anda jawab. Apakah Anda yakin ingin mengirim jawaban kuis sekarang?"
        confirmText="Ya, Kirim Sekarang"
        variant="warning"
      />
    </div>
  );
}
