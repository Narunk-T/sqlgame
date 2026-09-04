import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, ArrowRight, RotateCcw, Award, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { GameSession, QuizModule, QuestionAttempt } from '../../types';

interface ResultSummaryProps {
  session: GameSession;
  moduleData: QuizModule;
  onReplay: () => void;
  onBackToDashboard: () => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  session,
  moduleData,
  onReplay,
  onBackToDashboard,
}) => {
  const percentage = Math.round((session.totalScore / (session.maxPossibleScore || 1)) * 100);

  // Trigger celebration confetti
  useEffect(() => {
    if (percentage >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [percentage]);

  // Determine Grade
  let grade = 'S';
  let gradeBadgeColor = 'bg-amber-500 text-white';
  let title = 'ยอดเยี่ยมระดับเซียน SQL!';
  let sub = 'คุณตอบคำถามได้ถูกต้องแม่นยำแทบไม่มีข้อผิดพลาด';

  if (percentage >= 90) {
    grade = 'S';
    gradeBadgeColor = 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg';
    title = 'สุดยอดปรมาจารย์ SQL (Master Class)!';
  } else if (percentage >= 75) {
    grade = 'A';
    gradeBadgeColor = 'bg-emerald-500 text-white shadow-md';
    title = 'เก่งมากระดับมือโปร (Advanced Level)!';
  } else if (percentage >= 60) {
    grade = 'B';
    gradeBadgeColor = 'bg-blue-500 text-white';
    title = 'ทำได้ดีมาก (Good Effort)!';
    sub = 'เข้าใจหลักการ SQL เป็นอย่างดี ลองทบทวนข้อที่เสียคะแนนอีกนิดเพื่อคว้าเกรด S';
  } else {
    grade = 'C';
    gradeBadgeColor = 'bg-orange-500 text-white';
    title = 'ผ่านการทดสอบ (Keep Practicing)!';
    sub = 'ยังมีบางข้อที่ถูกหักคะแนนจากการตอบผิด สามารถกดเล่นซ้ำเพื่อฝึกฝนใหม่ได้เสมอ';
  }

  // Calculate total wrong attempts
  let totalDeductions = 0;
  let totalAttempts = 0;
  (Object.values(session.questionAttempts) as QuestionAttempt[]).forEach((att) => {
    totalDeductions += att.deductedPoints;
    totalAttempts += att.attemptsCount;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Hero Victory Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>สรุปผลการทดสอบ: {session.moduleTitle}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">{title}</h1>
            <p className="text-sm text-indigo-200 max-w-md">{sub}</p>
            <div className="pt-2 text-xs text-indigo-300">
              ผู้เล่น: <strong className="text-white">{session.userName}</strong>
            </div>
          </div>

          {/* Big Score / Grade Pill */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[170px] text-center shadow-inner">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2 ${gradeBadgeColor}`}>
              {grade}
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {session.totalScore}{' '}
              <span className="text-xs text-indigo-200 font-sans font-normal">/ {session.maxPossibleScore} คะแนน</span>
            </div>
            <div className="text-xs text-indigo-200 mt-1">ความแม่นยำ {percentage}%</div>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="text-center p-2 rounded-xl bg-white/5">
            <div className="text-xs text-indigo-300 flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>ตอบถูก</span>
            </div>
            <div className="text-lg font-bold font-mono mt-0.5">
              {(Object.values(session.questionAttempts) as QuestionAttempt[]).filter((a) => a.isCorrect).length} /{' '}
              {moduleData.questions.length} ข้อ
            </div>
          </div>

          <div className="text-center p-2 rounded-xl bg-white/5">
            <div className="text-xs text-indigo-300 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>ถูกหักคะแนนรวม</span>
            </div>
            <div className="text-lg font-bold font-mono mt-0.5 text-rose-300">
              -{totalDeductions} คะแนน
            </div>
          </div>

          <div className="text-center p-2 rounded-xl bg-white/5">
            <div className="text-xs text-indigo-300 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>ส่งคำตอบทั้งหมด</span>
            </div>
            <div className="text-lg font-bold font-mono mt-0.5">{totalAttempts} ครั้ง</div>
          </div>
        </div>
      </div>

      {/* Question by Question Detailed Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>รายละเอียดคะแนนในแต่ละข้อ</span>
        </h3>

        <div className="space-y-3">
          {moduleData.questions.map((q, idx) => {
            const attempt = session.questionAttempts[q.id];
            const isCorrect = attempt?.isCorrect ?? false;
            const earned = attempt?.earnedPoints ?? 0;
            const deducted = attempt?.deductedPoints ?? 0;
            const attemptsCount = attempt?.attemptsCount ?? 0;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-200">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{q.title}</span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ผ่าน</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        <span>ยังไม่ผ่าน</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 pl-8">
                    {q.description}
                  </div>
                  <div className="pl-8 pt-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                    เฉลย: <code>{q.solutionSQL}</code>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                    <span className="text-emerald-600 dark:text-emerald-400">+{earned}</span> / {q.basePoints} คะแนน
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ตอบ {attemptsCount} ครั้ง {deducted > 0 && <span className="text-rose-500 font-semibold">(-{deducted} แต้ม)</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Self-Evaluation Decision Guidance */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>คำแนะนำการประเมินตนเอง (Self-Evaluation Decision)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {totalDeductions > 0 ? (
              <>
                คุณเสียคะแนนจากการตอบผิดไป <strong className="text-rose-500 font-mono">-{totalDeductions} แต้ม</strong> หากต้องการเพิ่มเกรดและดันอันดับในห้อง แนะนำให้ <strong>กดเล่นใหม่อีกครั้ง</strong> เพื่อเก็บคะแนนเต็ม
              </>
            ) : percentage === 100 ? (
              <>
                🌟 ยอดเยี่ยมระดับ Master! คุณทำคะแนนเต็ม 100% โดยไม่มีข้อผิดพลาด พร้อมลุยแบบทดสอบในบทถัดไปได้ทันที
              </>
            ) : (
              <>
                คุณผ่านเกณฑ์การทดสอบแล้ว สามารถไปต่อบทถัดไป หรือกลับมาสอบซ้ำเพื่อทบทวนความแม่นยำได้ตลอดเวลา
              </>
            )}
          </p>
        </div>

        {totalDeductions > 0 && (
          <div className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
            + มีให้เก็บเพิ่ม {totalDeductions} แต้ม
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={onReplay}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
            totalDeductions > 0
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md hover:scale-[1.02]'
              : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{totalDeductions > 0 ? `ทดสอบซ้ำเพื่อเก็บเพิ่ม (+${totalDeductions} แต้ม)` : 'เล่นโจทย์ชุดนี้ใหม่อีกครั้ง'}</span>
        </button>

        <button
          onClick={onBackToDashboard}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <span>ดูแดชบอร์ดความก้าวหน้า & ประเมินตนเอง</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
