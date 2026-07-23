"use client";

import { CheckCircle2, Circle, Trophy } from "lucide-react";

export default function AdminProgressTable({ 
  students, 
  totalResources 
}: { 
  students: any[], 
  totalResources: number 
}) {
  return (
    <div className="card-soft p-6 border-2 border-green-500/20 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tabel Progres Belajar Siswa</h2>
          <p className="text-sm text-gray-500">Pantau perkembangan siswa dalam menyelesaikan materi E-Learning.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="py-3 px-4 font-bold text-gray-600">Nama Siswa</th>
              <th className="py-3 px-4 font-bold text-gray-600 text-center">Materi Selesai</th>
              <th className="py-3 px-4 font-bold text-gray-600 w-full">Progres Bar</th>
              <th className="py-3 px-4 font-bold text-gray-600">Nilai Quiz</th>
              <th className="py-3 px-4 font-bold text-gray-600 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Belum ada data siswa.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const completedCount = student.studentProgress?.length || 0;
                const percent = totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0;
                const isFinished = percent === 100 && totalResources > 0;
                
                // Get highest score per quiz
                const bestScores: Record<string, any> = {};
                if (student.quizAttempts) {
                  student.quizAttempts.forEach((attempt: any) => {
                    if (!bestScores[attempt.resourceId] || bestScores[attempt.resourceId].score < attempt.score) {
                      bestScores[attempt.resourceId] = attempt;
                    }
                  });
                }
                const quizResults = Object.values(bestScores);

                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">@{student.username}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                      {completedCount} / {totalResources}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isFinished ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-[var(--theme-primary,var(--color-primary))]'} transition-all`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-8">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {quizResults.length === 0 ? (
                          <span className="text-xs text-gray-400">-</span>
                        ) : (
                          quizResults.map((qr: any) => (
                            <span key={qr.id} className={`text-xs font-bold px-2 py-1 rounded-md ${qr.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} title={qr.resource?.title}>
                              {qr.score}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">
                          <Circle className="w-4 h-4" /> Belum
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
