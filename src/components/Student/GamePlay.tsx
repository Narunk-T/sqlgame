import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  QuizModule,
  Question,
  UserProfile,
  GameSession,
  TableData,
} from '../../types';
import { checkSQLAnswer, SQLEvalResult } from '../../utils/sqlEvaluator';
import { saveGameSession } from '../../utils/storage';
import { sound } from '../../utils/sound';
import { QuestionDragDrop } from './QuestionDragDrop';
import { QuestionFillBlank } from './QuestionFillBlank';
import { QuestionFreeType } from './QuestionFreeType';
import { ResultSummary } from './ResultSummary';
import {
  Play,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Trophy,
  ArrowRight,
  Flame,
  Table as TableIcon,
  RotateCcw,
  Sparkles,
  Info,
  SkipForward,
  XCircle,
} from 'lucide-react';

interface GamePlayProps {
  moduleData: QuizModule;
  currentUser: UserProfile;
  tables: Record<string, TableData>;
  onExit: () => void;
  onOpenTableViewer: (tableName?: string) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  moduleData,
  currentUser,
  tables,
  onExit,
  onOpenTableViewer,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [session, setSession] = useState<GameSession>(() => ({
    id: `session-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    moduleId: moduleData.id,
    moduleTitle: moduleData.title,
    startTime: Date.now(),
    currentQuestionIndex: 0,
    totalScore: 0,
    maxPossibleScore: moduleData.questions.reduce((acc, q) => acc + q.basePoints, 0),
    questionAttempts: {},
    isCompleted: false,
  }));

  // Current Question State
  const currentQuestion: Question = moduleData.questions[currentIdx] || moduleData.questions[0];
  
  // Current question points tracker (Starts at basePoints, drops by penalty upon wrong guess)
  const [currentQuestionPoints, setCurrentQuestionPoints] = useState<number>(currentQuestion.basePoints);
  const [attemptsThisQuestion, setAttemptsThisQuestion] = useState<number>(0);
  const [userSQL, setUserSQL] = useState<string>('');
  
  // Evaluation & Feedback State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
  const [isOutOfPoints, setIsOutOfPoints] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lastDeductionEffect, setLastDeductionEffect] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [evalResult, setEvalResult] = useState<SQLEvalResult | null>(null);

  const isQuestionFinished = isAnsweredCorrectly || isOutOfPoints;

  // When current question changes, reset per-question state
  useEffect(() => {
    if (!currentQuestion) return;
    setCurrentQuestionPoints(currentQuestion.basePoints);
    setAttemptsThisQuestion(0);
    setUserSQL('');
    setIsAnsweredCorrectly(false);
    setIsOutOfPoints(false);
    setFeedbackMessage(null);
    setShowHint(false);
    setEvalResult(null);
  }, [currentIdx, currentQuestion?.id]);

  // Handle checking the answer
  const handleCheckAnswer = () => {
    if (!userSQL.trim() || isQuestionFinished || isEvaluating) return;

    setIsEvaluating(true);
    const newAttemptCount = attemptsThisQuestion + 1;
    setAttemptsThisQuestion(newAttemptCount);

    // Evaluate
    const { isCorrect, feedback, userResult } = checkSQLAnswer(
      userSQL,
      currentQuestion.solutionSQL,
      tables
    );

    if (userResult) {
      setEvalResult(userResult);
    }

    if (isCorrect) {
      // Correct!
      sound.playCorrect();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      setIsAnsweredCorrectly(true);
      setFeedbackMessage(feedback);
      setStreak((prev) => prev + 1);

      // Points earned is the currentQuestionPoints
      const earned = currentQuestionPoints;
      const deducted = currentQuestion.basePoints - earned;

      // Update session
      const updatedAttempts = {
        ...session.questionAttempts,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          questionTitle: currentQuestion.title,
          attemptsCount: newAttemptCount,
          deductedPoints: deducted,
          earnedPoints: earned,
          maxPoints: currentQuestion.basePoints,
          isCorrect: true,
          timeSpentSeconds: 0,
          userAnswer: userSQL,
        },
      };

      const newTotalScore = session.totalScore + earned;
      const isLast = currentIdx === moduleData.questions.length - 1;

      const updatedSession: GameSession = {
        ...session,
        totalScore: newTotalScore,
        currentQuestionIndex: currentIdx,
        questionAttempts: updatedAttempts,
        isCompleted: isLast,
        endTime: isLast ? Date.now() : undefined,
      };

      setSession(updatedSession);
      saveGameSession(updatedSession);
    } else {
      // Wrong answer! Deduct configured penalty points (down to minPoints, default 0)
      sound.playWrong();
      const penalty = currentQuestion.penaltyPerWrong !== undefined ? Number(currentQuestion.penaltyPerWrong) : 1;
      const minP = currentQuestion.minPoints ?? 0;
      const newPts = Math.max(minP, currentQuestionPoints - penalty);
      setCurrentQuestionPoints(newPts);

      setLastDeductionEffect(true);
      setShakeTrigger(true);
      setStreak(0);

      setTimeout(() => setLastDeductionEffect(false), 2000);
      setTimeout(() => setShakeTrigger(false), 600);

      // Check if points reached 0 or lower (Out of points: finalize with 0 points and allow next question)
      if (newPts <= 0) {
        setIsOutOfPoints(true);
        setShowHint(true);
        setFeedbackMessage(
          feedback
            ? `${feedback} (คุณตอบผิดจนคะแนนข้อนี้เหลือ 0 แต้มแล้ว ระบบได้บันทึกคะแนนข้อนี้เป็น 0 คะแนน ให้ศึกษาเฉลยด้านล่างและกดทำข้อถัดไปได้เลย)`
            : 'คุณตอบผิดจนคะแนนข้อนี้เหลือ 0 แต้มแล้ว ระบบได้บันทึกคะแนนข้อนี้เป็น 0 คะแนน กรุณาศึกษาเฉลยและกดทำข้อถัดไป'
        );

        // Record question attempt with 0 points
        const updatedAttempts = {
          ...session.questionAttempts,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            questionTitle: currentQuestion.title,
            attemptsCount: newAttemptCount,
            deductedPoints: currentQuestion.basePoints,
            earnedPoints: 0,
            maxPoints: currentQuestion.basePoints,
            isCorrect: false,
            timeSpentSeconds: 0,
            userAnswer: userSQL,
          },
        };

        const isLast = currentIdx === moduleData.questions.length - 1;
        const updatedSession: GameSession = {
          ...session,
          currentQuestionIndex: currentIdx,
          questionAttempts: updatedAttempts,
          isCompleted: isLast,
          endTime: isLast ? Date.now() : undefined,
        };

        setSession(updatedSession);
        saveGameSession(updatedSession);
      } else {
        setFeedbackMessage(feedback);
      }
    }

    setIsEvaluating(false);
  };

  // Skip / Give Up on this question (Records 0 points and moves forward)
  const handleSkipQuestion = () => {
    if (isQuestionFinished) return;
    sound.playClick();
    setIsOutOfPoints(true);
    setCurrentQuestionPoints(0);
    setShowHint(true);
    setStreak(0);
    setFeedbackMessage(
      'คุณเลือกข้ามข้อนี้ ระบบได้บันทึกคะแนนข้อนี้เป็น 0 คะแนนเรียบร้อยแล้ว สามารถศึกษาเฉลยด้านล่างแล้วกดทำข้อถัดไปได้ทันที'
    );

    const newAttemptCount = attemptsThisQuestion + 1;
    setAttemptsThisQuestion(newAttemptCount);

    const updatedAttempts = {
      ...session.questionAttempts,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        questionTitle: currentQuestion.title,
        attemptsCount: newAttemptCount,
        deductedPoints: currentQuestion.basePoints,
        earnedPoints: 0,
        maxPoints: currentQuestion.basePoints,
        isCorrect: false,
        timeSpentSeconds: 0,
        userAnswer: userSQL.trim() || '(ข้ามข้อนี้)',
      },
    };

    const isLast = currentIdx === moduleData.questions.length - 1;
    const updatedSession: GameSession = {
      ...session,
      currentQuestionIndex: currentIdx,
      questionAttempts: updatedAttempts,
      isCompleted: isLast,
      endTime: isLast ? Date.now() : undefined,
    };

    setSession(updatedSession);
    saveGameSession(updatedSession);
  };

  // Move to next question or complete
  const handleNextQuestion = () => {
    if (currentIdx < moduleData.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Finalize session
      const finalSession: GameSession = {
        ...session,
        isCompleted: true,
        endTime: Date.now(),
      };
      setSession(finalSession);
      saveGameSession(finalSession);
    }
  };

  // Restart module
  const handleReplay = () => {
    const freshSession: GameSession = {
      id: `session-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      moduleId: moduleData.id,
      moduleTitle: moduleData.title,
      startTime: Date.now(),
      currentQuestionIndex: 0,
      totalScore: 0,
      maxPossibleScore: moduleData.questions.reduce((acc, q) => acc + q.basePoints, 0),
      questionAttempts: {},
      isCompleted: false,
    };
    setSession(freshSession);
    setCurrentIdx(0);
    setStreak(0);
    saveGameSession(freshSession);
  };

  // If completed, show summary screen
  if (session.isCompleted) {
    return (
      <ResultSummary
        session={session}
        moduleData={moduleData}
        onReplay={handleReplay}
        onBackToDashboard={onExit}
      />
    );
  }

  const targetTableData = tables[currentQuestion.targetTable];
  const progressPercent = Math.round(((currentIdx + (isQuestionFinished ? 1 : 0)) / moduleData.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Top Game Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Module Title & Quest Progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ← ออกจากเกม
          </button>
          <div>
            <div className="text-xs text-slate-400 font-medium">
              ข้อที่ {currentIdx + 1} จาก {moduleData.questions.length} ข้อ
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {moduleData.title}
            </div>
          </div>
        </div>

        {/* Dynamic Score & Streak Pills */}
        <div className="flex items-center gap-2.5">
          {/* Current Question Points with Live Deduction Effect */}
          <div className="relative">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
                isOutOfPoints
                  ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : lastDeductionEffect
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/60 dark:border-rose-700 scale-105'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span>คะแนนข้อนี้:</span>
              <span className="text-sm font-black">{currentQuestionPoints}</span>
              <span className="text-[10px] font-normal opacity-80">/ {currentQuestion.basePoints} แต้ม</span>
              {isOutOfPoints && <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">(0 แต้ม)</span>}
            </div>

            {/* Floating Deduction Warning Tag */}
            {lastDeductionEffect && !isOutOfPoints && (
              <span className="absolute -bottom-5 right-2 text-xs font-bold text-rose-600 dark:text-rose-400 animate-bounce">
                -{(currentQuestion.penaltyPerWrong !== undefined ? currentQuestion.penaltyPerWrong : 1)} คะแนน!
              </span>
            )}
          </div>

          {/* Total Accumulated Score */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>คะแนนสะสมรวม:</span>
            <span className="text-sm font-black text-blue-900 dark:text-blue-200">{session.totalScore}</span>
          </div>

          {/* Streak */}
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-300 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>{streak} ต่อเนื่อง!</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Mission Card */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm transition-transform ${
          shakeTrigger ? 'animate-bounce text-rose-900' : ''
        }`}
      >
        {/* Mission Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm font-mono">
              Q{currentIdx + 1}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {currentQuestion.type === 'free_type' || currentQuestion.type === 'free_text'
                    ? '⚡ โหมดท้าทายพิมพ์คำสั่ง SQL สด (Free-Text Challenge)'
                    : currentQuestion.type === 'drag_drop'
                    ? '🎮 โหมดลากวางจัดเรียงคำสั่ง (Drag & Arrange)'
                    : '✏️ โหมดเติมคำในช่องว่าง (Fill in the Blanks)'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-medium border border-amber-200 dark:border-amber-800/60">
                  คะแนนเต็ม {currentQuestion.basePoints} แต้ม {currentQuestion.penaltyPerWrong === 0 ? '(ไม่หักคะแนน)' : `(ตอบผิดหัก -${currentQuestion.penaltyPerWrong ?? 1} แต้ม)`}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {currentQuestion.title}
              </h2>
            </div>
          </div>

          {/* Quick Table Viewer Button */}
          <button
            onClick={() => onOpenTableViewer(currentQuestion.targetTable)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0 cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>ดูตาราง {currentQuestion.targetTable}</span>
          </button>
        </div>

        {/* Question Instruction */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-sm leading-relaxed mb-6">
          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>คำอธิบายโจทย์:</span>
          </div>
          <p>{currentQuestion.description}</p>
        </div>

        {/* Target Table Preview Helper (Mini Card) */}
        {targetTableData && (
          <div className="mb-5 p-3.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">ตารางที่เกี่ยวข้อง:</span>
              <code className="font-mono bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border text-indigo-600 dark:text-indigo-300 font-bold">
                {targetTableData.tableName}
              </code>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span>คอลัมน์:</span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {targetTableData.columns.map((c) => c.name).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Interactive Question Input Mode */}
        <div className="my-6">
          {currentQuestion.type === 'free_type' || currentQuestion.type === 'free_text' ? (
            <QuestionFreeType
              question={currentQuestion}
              currentAnswer={userSQL}
              onAnswerChange={setUserSQL}
              onSubmit={handleCheckAnswer}
              disabled={isQuestionFinished}
              targetTableData={targetTableData}
            />
          ) : currentQuestion.type === 'drag_drop' ? (
            <QuestionDragDrop
              question={currentQuestion}
              currentAnswer={userSQL}
              onAnswerChange={setUserSQL}
              disabled={isQuestionFinished}
            />
          ) : (
            <QuestionFillBlank
              question={currentQuestion}
              currentAnswer={userSQL}
              onAnswerChange={setUserSQL}
              disabled={isQuestionFinished}
            />
          )}
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 my-4 animate-in slide-in-from-top-2 duration-200 ${
              isAnsweredCorrectly
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                : isOutOfPoints
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
            }`}
          >
            {isAnsweredCorrectly ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : isOutOfPoints ? (
              <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">
                {isAnsweredCorrectly
                  ? 'ยินดีด้วย! ตอบถูกต้อง'
                  : isOutOfPoints
                  ? 'บันทึกคะแนนในข้อนี้ 0 คะแนน'
                  : 'ยังไม่ถูกต้อง'}
              </div>
              <p className="text-xs opacity-90 leading-relaxed">{feedbackMessage}</p>
              {!isQuestionFinished && (
                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 pt-1">
                  💡 ถูกหัก {currentQuestion.penaltyPerWrong ?? 1} คะแนน (เหลือ {currentQuestionPoints} คะแนน) ลองตรวจสอบแล้วกดตรวจคำตอบใหม่ได้เลย!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simulated Live Query Result Table when Available */}
        {evalResult && evalResult.success && evalResult.rows.length > 0 && (
          <div className="my-4 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5" />
                <span>ผลลัพธ์จากการรันคำสั่ง SQL จริง ({evalResult.rowCount} แถว):</span>
              </span>
            </div>
            <div className="overflow-x-auto max-h-[160px] border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800 text-slate-300 sticky top-0">
                  <tr>
                    {evalResult.columns.map((c) => (
                      <th key={c} className="px-3 py-1.5">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950 text-slate-300">
                  {evalResult.rows.map((r, rI) => (
                    <tr key={rI}>
                      {evalResult.columns.map((c) => (
                        <td key={c} className="px-3 py-1 whitespace-nowrap">
                          {r[c] !== undefined ? String(r[c]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teacher Explanation Card upon Correct Answer or Out-of-Points Finalization */}
        {isQuestionFinished && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 my-4 animate-in fade-in duration-200 ${
              isAnsweredCorrectly
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100'
                : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {isAnsweredCorrectly
                  ? 'คำอธิบายเฉลยจากอาจารย์ผู้สอน:'
                  : 'เฉลยและคำอธิบายเพื่อการเรียนรู้ (คะแนนข้อนี้: 0 แต้ม):'}
              </span>
            </div>
            <p className="leading-relaxed">{currentQuestion.explanation}</p>
            <div className="pt-2 font-mono text-[11px] text-indigo-800 dark:text-indigo-200">
              คำสั่ง SQL ที่ถูกต้อง: <code className="bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-md font-bold text-indigo-950 dark:text-indigo-100">{currentQuestion.solutionSQL}</code>
            </div>
          </div>
        )}

        {/* Hint Box */}
        {showHint && !isQuestionFinished && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 my-3">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">คำใบ้จากครู:</strong>
              <span>{currentQuestion.hint}</span>
            </div>
          </div>
        )}

        {/* Controls & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
          <div className="flex items-center gap-2">
            {!isQuestionFinished && (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? 'ซ่อนคำใบ้' : 'ขอคำใบ้จากครู'}</span>
                </button>

                {attemptsThisQuestion >= 2 && (
                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                    title="ข้ามข้อนี้และบันทึกคะแนนเป็น 0 เพื่อทำข้อถัดไป"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>ข้ามข้อนี้ (ได้ 0 คะแนน)</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isQuestionFinished ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={!userSQL.trim() || isEvaluating}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>ตรวจคำตอบ & รัน SQL</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className={`flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all animate-in zoom-in-95 cursor-pointer ${
                  isAnsweredCorrectly
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <span>
                  {currentIdx < moduleData.questions.length - 1
                    ? isAnsweredCorrectly
                      ? 'ลุยข้อถัดไป'
                      : 'ไปทำข้อถัดไป (0 แต้ม)'
                    : 'ดูสรุปผลคะแนนรวม'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
