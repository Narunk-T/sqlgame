import React, { useState } from 'react';
import {
  QuizModule,
  UserProfile,
  TableData,
  StudentStats,
  GameSession,
} from '../../types';
import {
  Sparkles,
  Trophy,
  Play,
  CheckCircle2,
  Award,
  BookOpen,
  Database,
  Flame,
  ArrowRight,
  HelpCircle,
  BarChart3,
  RotateCcw,
  Star,
  Target,
  Zap,
  Clock,
  Compass,
} from 'lucide-react';
import { StudentProgressDashboard } from './StudentProgressDashboard';
import { calculateStudentEvaluation } from '../../utils/storage';

interface StudentDashboardProps {
  currentUser: UserProfile;
  modules: QuizModule[];
  tables: Record<string, TableData>;
  sessions?: GameSession[];
  leaderboard: StudentStats[];
  onStartModule: (module: QuizModule) => void;
  onOpenCheatsheet: () => void;
  onOpenDatabaseViewer: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  modules,
  tables,
  sessions = [],
  leaderboard,
  onStartModule,
  onOpenCheatsheet,
  onOpenDatabaseViewer,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'modules' | 'leaderboard'>('progress');

  // Compute rich personal progress and self-evaluation data
  const evaluation = calculateStudentEvaluation(currentUser.id, modules, sessions);
  const currentStudentStats = leaderboard.find((s) => s.userId === currentUser.id);
  const myRank = leaderboard.findIndex((s) => s.userId === currentUser.id) + 1;

  const totalQuestions = modules.reduce((acc, m) => acc + m.questions.length, 0);
  const totalPossiblePoints = modules.reduce(
    (acc, m) => acc + m.questions.reduce((qAcc, q) => qAcc + q.basePoints, 0),
    0
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Student Welcome & Gamification Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ยินดีต้อนรับสู่ SQL Quest: สนามประลองคำสั่งฐานข้อมูล</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
              <span>สวัสดี, {currentUser.name}</span>
              <span className="text-3xl">{currentUser.avatar}</span>
            </h1>
            <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
              ฝึกเขียน SQL ผ่านเกมเติมคำและลากวางคำตอบ ตอบถูกสะสมคะแนน ตอบผิดหักครั้งละ 1 คะแนน สู้เพื่อเป็น Master of SQL!
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl min-w-[120px] text-center">
              <div className="text-xs text-blue-200">คะแนนสะสมจริง</div>
              <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
                {evaluation.totalScoreEarned}{' '}
                <span className="text-xs text-blue-200 font-normal">/ {evaluation.totalPossibleScore}</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl min-w-[100px] text-center">
              <div className="text-xs text-blue-200">อันดับในห้อง</div>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                #{myRank > 0 ? myRank : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Decision Notification Strip inside Banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-sky-100">
            <Zap className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>คำแนะนำประเมินตนเอง:</strong>{' '}
              {evaluation.recommendedNextAction.title.replace(/^[^\wก-๙]+/, '')}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('progress')}
            className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer shrink-0"
          >
            <span>ดูแดชบอร์ดความก้าวหน้าเต็ม</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-start sm:justify-center border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'progress'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>แดชบอร์ดความก้าวหน้าและการประเมินตนเอง</span>
          {evaluation.bestScorePotentialGain > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
              +{evaluation.bestScorePotentialGain} แต้ม
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'modules'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>ด่านภารกิจทั้งหมด ({modules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>กระดานอันดับห้องเรียน</span>
        </button>
      </div>

      {/* Quick Access Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onOpenCheatsheet}
          className="flex items-center justify-between p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                คู่มือสรุปคำสั่ง SQL (Cheat Sheet)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                เปิดดูสูตร SELECT, WHERE, ORDER BY, GROUP BY, JOIN ได้ตลอดเวลา
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
        </button>

        <button
          onClick={onOpenDatabaseViewer}
          className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                สำรวจฐานข้อมูลจำลอง (Virtual DB)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ดูตาราง students, products, departments, employees, orders, order_details
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* TAB 1: PERSONAL PROGRESS & SELF-EVALUATION DASHBOARD */}
      {activeTab === 'progress' && (
        <StudentProgressDashboard
          evaluation={evaluation}
          modules={modules}
          sessions={sessions}
          currentUser={currentUser}
          onStartModule={onStartModule}
          onOpenCheatsheet={onOpenCheatsheet}
        />
      )}

      {/* TAB 2: QUEST MODULES GRID WITH ENHANCED SELF-EVALUATION DATA */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                เลือกบทเรียนและด่านภารกิจ (SQL Quest Modules)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                มีทั้งหมด {modules.length} บทเรียน ({totalQuestions} ข้อคำถาม, รวม {totalPossiblePoints} คะแนน)
              </p>
            </div>
            <button
              onClick={() => setActiveTab('progress')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ดูสรุปผลประเมินตนเอง</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod, idx) => {
              const moduleMaxPts = mod.questions.reduce((a, b) => a + b.basePoints, 0);
              const progressItem = evaluation.moduleProgressList.find((p) => p.moduleId === mod.id);

              const bestScore = progressItem?.bestScore || 0;
              const percentage = progressItem?.percentage || 0;
              const grade = progressItem?.grade || 'N/A';
              const isMastered = progressItem?.status === 'mastered';
              const canBoost = (progressItem?.scoreBoostPotential || 0) > 0 && (progressItem?.completedAttemptsCount || 0) > 0;

              return (
                <div
                  key={mod.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isMastered
                      ? 'border-purple-200 dark:border-purple-900/60'
                      : canBoost
                      ? 'border-amber-200 dark:border-amber-900/60'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          ด่านที่ {idx + 1}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            mod.difficulty === 'beginner'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : mod.difficulty === 'intermediate'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {mod.difficulty === 'beginner'
                            ? 'ระดับเริ่มต้น'
                            : mod.difficulty === 'intermediate'
                            ? 'ระดับปานกลาง'
                            : 'ระดับสูง'}
                        </span>
                      </div>

                      {/* Grade / Master Pill */}
                      {grade !== 'N/A' && (
                        <span
                          className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                            grade === 'S'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : grade === 'A'
                              ? 'bg-emerald-500 text-white'
                              : grade === 'B'
                              ? 'bg-blue-500 text-white'
                              : 'bg-orange-500 text-white'
                          }`}
                        >
                          เกรด {grade}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {mod.description}
                      </p>
                    </div>

                    {/* Score status & breakdown */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          ผลงานที่ดีที่สุดของคุณ:
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                          {progressItem?.completedAttemptsCount ? (
                            <>
                              <span className="text-blue-600 dark:text-blue-400">{bestScore}</span> / {moduleMaxPts} คะแนน ({percentage}%)
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">ยังไม่ได้ทำ</span>
                          )}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            percentage === 100
                              ? 'bg-purple-600'
                              : percentage >= 80
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {canBoost && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-0.5">
                          <Zap className="w-3 h-3" />
                          <span>สามารถทดสอบซ้ำเพื่อเก็บคะแนนเพิ่มได้อีก +{progressItem.scoreBoostPotential} แต้ม</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      {mod.questions.length} ข้อคำถาม (หักครั้งละ -1)
                    </div>
                    <button
                      onClick={() => onStartModule(mod)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer ${
                        canBoost
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                          : isMastered
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {progressItem?.completedAttemptsCount ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{canBoost ? `ทดสอบซ้ำ (+${progressItem.scoreBoostPotential} แต้ม)` : 'ทบทวนอีกครั้ง'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>เริ่มทำภารกิจ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSROOM LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  กระดานคะแนนห้องเรียน (Classroom Leaderboard)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ตารางอันดับคะแนนสะสมของนักเรียนในชั้นเรียน
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">อันดับ</th>
                  <th className="py-2.5 px-4">ชื่อนักเรียน</th>
                  <th className="py-2.5 px-4 text-center">บทที่สำเร็จ</th>
                  <th className="py-2.5 px-4 text-center">ความแม่นยำ</th>
                  <th className="py-2.5 px-4 text-right rounded-r-xl">คะแนนสะสมรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((item, idx) => {
                  const isMe = item.userId === currentUser.id;
                  return (
                    <tr
                      key={item.userId}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs inline-flex items-center justify-center shadow-xs">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs inline-flex items-center justify-center">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs inline-flex items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono pl-1">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {item.userName}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded-md font-bold">
                              ฉัน
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.quizzesCompleted} ชุด
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.quizzesCompleted > 0 || item.totalAttempts > 0
                          ? `${item.accuracyRate}%`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                          {item.totalScore}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">คะแนน</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
