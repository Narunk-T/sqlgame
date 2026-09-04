import React, { useState } from 'react';
import {
  StudentDetailedEvaluation,
  ModuleProgress,
  QuizModule,
  GameSession,
  UserProfile,
} from '../../types';
import {
  Sparkles,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Play,
  Clock,
  Award,
  BookOpen,
  Filter,
  ShieldCheck,
  Flame,
  HelpCircle,
  BarChart3,
  Calendar,
  ChevronRight,
  Star,
} from 'lucide-react';

interface StudentProgressDashboardProps {
  evaluation: StudentDetailedEvaluation;
  modules: QuizModule[];
  sessions: GameSession[];
  currentUser: UserProfile;
  onStartModule: (module: QuizModule) => void;
  onOpenCheatsheet: () => void;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  evaluation,
  modules,
  sessions,
  currentUser,
  onStartModule,
  onOpenCheatsheet,
}) => {
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'needs_boost' | 'mastered' | 'not_started'
  >('all');
  const [selectedHistorySession, setSelectedHistorySession] = useState<GameSession | null>(null);

  // Student's completed sessions
  const userSessions = sessions
    .filter((s) => s.userId === currentUser.id)
    .sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));

  // Filter modules
  const filteredModules = evaluation.moduleProgressList.filter((m) => {
    if (filterStatus === 'needs_boost') return m.completedAttemptsCount > 0 && m.scoreBoostPotential > 0;
    if (filterStatus === 'mastered') return m.status === 'mastered';
    if (filterStatus === 'not_started') return m.status === 'not_started';
    return true;
  });

  // Find module object by ID
  const getModuleObj = (moduleId: string) => modules.find((m) => m.id === moduleId);

  // Quick Action Handler from Recommended Action
  const handleRecommendedAction = () => {
    if (evaluation.recommendedNextAction.targetModuleId) {
      const mod = getModuleObj(evaluation.recommendedNextAction.targetModuleId);
      if (mod) onStartModule(mod);
    } else if (modules.length > 0) {
      onStartModule(modules[0]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. SMART DECISION ADVISOR BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-6 sm:p-7 shadow-xl border border-indigo-500/30">
        {/* Background glow accents */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>ระบบช่วยตัดสินใจประเมินตนเอง (Self-Evaluation & Decision Guide)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              {evaluation.recommendedNextAction.title}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {evaluation.recommendedNextAction.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ระดับทักษะ: <strong className="text-white">{evaluation.masteryTitle}</strong></span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
                <Star className="w-4 h-4 text-amber-400" />
                <span>เกรดรวม: <strong className="text-amber-300 font-bold">{evaluation.overallGrade}</strong></span>
              </div>
            </div>
          </div>

          {/* Direct CTA Decision Button */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleRecommendedAction}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {evaluation.recommendedNextAction.actionType === 'boost' ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{evaluation.recommendedNextAction.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenCheatsheet}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-300" />
              <span>เปิดคู่มือคำสั่ง SQL ทบทวนก่อนสอบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OVERALL MASTERY & PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Score & Potential Boost */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">คะแนนสะสมจริง</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                {evaluation.totalScoreEarned}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ เต็ม {evaluation.totalPossibleScore}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${evaluation.overallPercentage}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>เก็บได้เพิ่มอีก</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              +{evaluation.bestScorePotentialGain} แต้ม
            </span>
          </div>
        </div>

        {/* Card 2: Curriculum Completion */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ความก้าวหน้าหลักสูตร</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                {evaluation.completedModulesCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {evaluation.totalModulesCount} บทเรียน</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${evaluation.completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>สำเร็จ 100% (Master)</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
              {evaluation.masteredModulesCount} บท
            </span>
          </div>
        </div>

        {/* Card 3: Accuracy & Deduction Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ความแม่นยำในการตอบ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                {evaluation.accuracyRate}%
              </span>
              <span className="text-xs text-slate-400">เฉลี่ย</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  evaluation.accuracyRate >= 80
                    ? 'bg-emerald-500'
                    : evaluation.accuracyRate >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${evaluation.accuracyRate}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>แต้มที่ถูกหักสะสม</span>
            <span className="font-bold text-rose-500 font-mono">
              -{evaluation.totalMistakeDeductions} แต้ม
            </span>
          </div>
        </div>

        {/* Card 4: Evaluation Grade & Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เกรดประเมินตนเอง</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black font-mono shadow-xs ${
                evaluation.overallGrade === 'S'
                  ? 'bg-amber-400 text-slate-950 shadow-amber-400/40'
                  : evaluation.overallGrade === 'A'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : evaluation.overallGrade === 'B'
                  ? 'bg-blue-500 text-white shadow-blue-500/30'
                  : evaluation.overallGrade === 'C'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {evaluation.overallGrade}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {evaluation.overallGrade === 'S'
                  ? 'ระดับยอดเยี่ยมสูงสุด'
                  : evaluation.overallGrade === 'A'
                  ? 'ระดับดีเยี่ยม'
                  : evaluation.overallGrade === 'B'
                  ? 'ระดับดี'
                  : evaluation.overallGrade === 'C'
                  ? 'ระดับพอใช้'
                  : 'ยังไม่ได้เริ่มประเมิน'}
              </div>
              <div className="text-[11px] text-slate-400">คำนวณจากคะแนนจริง</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>ส่งคำตอบทั้งหมด</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
              {evaluation.totalAttemptsCount} ครั้ง
            </span>
          </div>
        </div>
      </div>

      {/* 3. MODULE-BY-MODULE PROGRESS & DECISION MATRIX */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>การประเมินตนเองรายบทเรียน (Module Progress Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              วิเคราะห์คะแนนแต่ละบทเรียนเพื่อตัดสินใจ: ไปบทถัดไป หรือ ทำซ้ำเพื่อเก็บคะแนนเพิ่ม
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({evaluation.moduleProgressList.length})
            </button>
            <button
              onClick={() => setFilterStatus('needs_boost')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'needs_boost'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>ควรทดสอบซ้ำ ({evaluation.moduleProgressList.filter((m) => m.completedAttemptsCount > 0 && m.scoreBoostPotential > 0).length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('mastered')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'mastered'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Master 100% ({evaluation.masteredModulesCount})
            </button>
            <button
              onClick={() => setFilterStatus('not_started')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === 'not_started'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              ยังไม่เริ่ม ({evaluation.moduleProgressList.filter((m) => m.status === 'not_started').length})
            </button>
          </div>
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((item, idx) => {
            const modObj = getModuleObj(item.moduleId);
            if (!modObj) return null;

            return (
              <div
                key={item.moduleId}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                  item.status === 'mastered'
                    ? 'border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 hover:border-purple-400'
                    : item.scoreBoostPotential > 0 && item.completedAttemptsCount > 0
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 hover:border-amber-400'
                    : item.status === 'not_started'
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-300'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        ด่านที่ {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.difficulty === 'beginner'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.difficulty === 'intermediate'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {item.difficulty === 'beginner' ? 'ระดับเริ่มต้น' : item.difficulty === 'intermediate' ? 'ระดับปานกลาง' : 'ระดับสูง'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'mastered' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Mastered 100%</span>
                        </span>
                      ) : item.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ผ่านแล้ว (เกรด {item.grade})</span>
                        </span>
                      ) : item.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>กำลังฝึกฝน</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          <span>ยังไม่เริ่ม</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {item.moduleTitle}
                  </h4>

                  {/* Score & Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        คะแนนสูงสุดที่ทำได้:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                          {item.bestScore} / {item.maxPoints} แต้ม ({item.percentage}%)
                        </span>
                        {item.grade !== 'N/A' && (
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-bold font-mono inline-flex items-center justify-center ${
                              item.grade === 'S'
                                ? 'bg-amber-400 text-slate-950'
                                : item.grade === 'A'
                                ? 'bg-emerald-500 text-white'
                                : item.grade === 'B'
                                ? 'bg-blue-500 text-white'
                                : 'bg-orange-500 text-white'
                            }`}
                          >
                            {item.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          item.percentage === 100
                            ? 'bg-purple-600'
                            : item.percentage >= 80
                            ? 'bg-emerald-500'
                            : item.percentage >= 60
                            ? 'bg-blue-500'
                            : item.percentage > 0
                            ? 'bg-amber-500'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actionable Advice Text */}
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    {item.scoreBoostPotential > 0 && item.completedAttemptsCount > 0 ? (
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : item.status === 'mastered' ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    ) : (
                      <Play className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">
                      {item.recommendation.text}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {item.lastAttemptAt
                        ? `ทำล่าสุด: ${item.lastAttemptAt}`
                        : `ทั้งหมด ${item.totalQuestions} ข้อ`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartModule(modObj)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        item.scoreBoostPotential > 0 && item.completedAttemptsCount > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black hover:scale-[1.02]'
                          : item.status === 'mastered'
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {item.completedAttemptsCount > 0 ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white" />
                      )}
                      <span>{item.recommendation.actionLabel}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT ATTEMPTS & SUBMISSION LOG */}
      {userSessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  ประวัติการส่งผลการทดสอบ (Recent Attempt Submissions)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  บันทึกผลการเข้าสอบแต่ละครั้ง สามารถดูย้อนหลังเพื่อวิเคราะห์จุดที่ทำคะแนนตกหล่น
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">วันและเวลาที่ทดสอบ</th>
                  <th className="py-2.5 px-4">ชื่อบทเรียน</th>
                  <th className="py-2.5 px-4 text-center">สถานะ</th>
                  <th className="py-2.5 px-4 text-center">หักคะแนน</th>
                  <th className="py-2.5 px-4 text-right">คะแนนที่ได้</th>
                  <th className="py-2.5 px-4 text-right rounded-r-xl">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userSessions.slice(0, 8).map((s) => {
                  const mod = getModuleObj(s.moduleId);
                  let totalDeductions = 0;
                  (Object.values(s.questionAttempts || {}) as any[]).forEach((att) => {
                    totalDeductions += att?.deductedPoints || 0;
                  });

                  const timeStr = new Date(s.endTime || s.startTime).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const percent = Math.round((s.totalScore / (s.maxPossibleScore || 1)) * 100);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {timeStr}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {s.moduleTitle}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            เสร็จสมบูรณ์ ({percent}%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            ยังไม่เสร็จ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {totalDeductions > 0 ? (
                          <span className="text-rose-500 font-bold">-{totalDeductions} แต้ม</span>
                        ) : (
                          <span className="text-emerald-500 font-bold">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-blue-600 dark:text-blue-400">{s.totalScore}</span> / {s.maxPossibleScore}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {mod && (
                          <button
                            onClick={() => onStartModule(mod)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>สอบซ้ำ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SELF-EVALUATION CRITERIA & TIPS */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>เกณฑ์การประเมินตนเองและการคิดคะแนนในระบบ SQL Quest</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">กฎการหักคะแนน (-1 แต้ม)</strong>
            ทุกครั้งที่ส่งคำตอบผิดในข้อนั้น จะถูกหักครั้งละ 1 คะแนน แต่จะไม่ติดลบต่ำกว่า 0 คะแนน
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">การทดสอบซ้ำเพื่อเพิ่มคะแนน</strong>
            ระบบจะนับคะแนนที่ดีที่สุด (Best Score) ของแต่ละบทเรียนมาเป็นคะแนนสะสมหลัก สามารถสอบซ้ำได้ไม่จำกัด
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">เกณฑ์การตัดเกรด</strong>
            เกรด S (≥95%), เกรด A (≥80%), เกรด B (≥65%), เกรด C (≥50%) เพื่อเป้าหมายสู่ระดับ Master
          </div>
        </div>
      </div>
    </div>
  );
};
