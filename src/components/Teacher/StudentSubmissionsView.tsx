import React, { useState, useMemo } from 'react';
import { GameSession, QuizModule, StudentStats, QuestionAttempt, UserProfile } from '../../types';
import { ScoreReportModal } from './ScoreReportModal';
import {
  Users,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  ArrowUpDown,
  ShieldAlert,
  GraduationCap,
  Filter,
  Printer,
  FileSpreadsheet,
  School,
  BookOpen,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { sortThaiAlphabetical, getSavedGradeLevels, getSavedMajors } from '../../utils/storage';

interface StudentSubmissionsViewProps {
  sessions: GameSession[];
  modules: QuizModule[];
  leaderboard: StudentStats[];
  usersList?: UserProfile[];
  gradeLevels?: string[];
  majors?: string[];
  currentUser?: UserProfile | null;
  passingThreshold?: number;
  onPassingThresholdChange?: (val: number) => void;
}

export const StudentSubmissionsView: React.FC<StudentSubmissionsViewProps> = ({
  sessions,
  modules,
  leaderboard,
  usersList = [],
  gradeLevels,
  majors,
  currentUser,
  passingThreshold,
  onPassingThresholdChange,
}) => {
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const completedSessions = sessions.filter((s) => s.isCompleted);
  const activeStudents = leaderboard.filter((s) => s.totalAttempts > 0 || s.quizzesCompleted > 0);
  const classAverageAccuracy = activeStudents.length > 0
    ? Math.round(
        activeStudents.reduce((a, b) => a + b.accuracyRate, 0) / activeStudents.length
      )
    : 0;

  // Extract distinct majors dynamically from database majors state + usersList + modules (sorted ก-ฮ)
  const distinctMajors = useMemo(() => {
    const set = new Set<string>(majors && majors.length > 0 ? majors : getSavedMajors());
    usersList.forEach((u) => {
      if (u.major && u.major !== 'ทุกสาขาวิชา' && u.major.trim()) set.add(u.major.trim());
    });
    modules.forEach((m) => {
      if (m.targetMajor && m.targetMajor !== 'ทุกสาขาวิชา' && m.targetMajor.trim()) set.add(m.targetMajor.trim());
    });
    return sortThaiAlphabetical(Array.from(set));
  }, [majors, usersList, modules]);

  // Extract distinct grade levels / rooms dynamically from database gradeLevels state + usersList + modules (sorted ก-ฮ)
  const distinctRooms = useMemo(() => {
    const set = new Set<string>(gradeLevels && gradeLevels.length > 0 ? gradeLevels : getSavedGradeLevels());
    usersList.forEach((u) => {
      if (u.gradeLevel && u.gradeLevel !== 'ทุกห้อง' && u.gradeLevel.trim()) set.add(u.gradeLevel.trim());
    });
    modules.forEach((m) => {
      if (m.targetGradeLevel && m.targetGradeLevel !== 'ทุกห้อง' && m.targetGradeLevel.trim()) set.add(m.targetGradeLevel.trim());
    });
    return sortThaiAlphabetical(Array.from(set));
  }, [gradeLevels, usersList, modules]);

  const filteredSessions = useMemo(() => {
    return completedSessions.filter((s) => {
      const studentUser = usersList.find((u) => u.id === s.userId || u.name === s.userName);
      const relatedModule = modules.find((m) => m.id === s.moduleId);

      // Module Filter
      if (selectedModuleFilter !== 'all' && s.moduleId !== selectedModuleFilter) {
        return false;
      }

      // Major Filter (Support multi-grade levels per major)
      if (selectedMajorFilter !== 'all') {
        const studentMajor = studentUser?.major;
        const moduleMajor = relatedModule?.targetMajor;
        const matchStudent = studentMajor === selectedMajorFilter;
        const matchModule = moduleMajor === selectedMajorFilter;
        if (!matchStudent && !matchModule) {
          return false;
        }
      }

      // Room / Grade Level Filter
      if (selectedRoomFilter !== 'all') {
        const studentRoom = studentUser?.gradeLevel;
        const moduleRoom = relatedModule?.targetGradeLevel;
        const matchStudent = studentRoom === selectedRoomFilter;
        const matchModule = moduleRoom === selectedRoomFilter;
        if (!matchStudent && !matchModule) {
          return false;
        }
      }

      // Search query
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        const matchesSearch =
          s.userName.toLowerCase().includes(q) ||
          s.moduleTitle.toLowerCase().includes(q) ||
          (studentUser?.studentId || '').toLowerCase().includes(q) ||
          (studentUser?.major || '').toLowerCase().includes(q) ||
          (studentUser?.gradeLevel || '').toLowerCase().includes(q) ||
          (studentUser?.nickname || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [completedSessions, usersList, modules, selectedModuleFilter, selectedMajorFilter, selectedRoomFilter, searchStudent]);

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">รอบการเล่นที่เสร็จสมบูรณ์</div>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
              {completedSessions.length}{' '}
              <span className="text-xs text-slate-400 font-sans font-normal">ครั้ง</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">นักเรียนที่ส่งงานแล้ว</div>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
              {activeStudents.length}{' '}
              <span className="text-xs text-slate-400 font-sans font-normal">
                / {leaderboard.length} คน
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ความแม่นยำเฉลี่ยของทั้งห้อง</div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {classAverageAccuracy}%
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Print Report Button */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักเรียน, สาขา..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 font-medium"
              />
            </div>

            {/* Major Filter */}
            <div className="relative">
              <select
                value={selectedMajorFilter}
                onChange={(e) => setSelectedMajorFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="all">ทุกสาขาวิชา (All Majors)</option>
                {distinctMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Room / Grade Level Filter */}
            <div className="relative">
              <select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="all">ทุกระดับชั้น / ทุกห้อง (All Rooms)</option>
                {distinctRooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Filter */}
            <div className="relative">
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold truncate"
              >
                <option value="all">ทุกบทเรียน (All Modules)</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Print Report Action Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsReportModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            title="พิมพ์รายงานผลคะแนนจากการกรองข้อมูลสาขาวิชาและระดับชั้น"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานผลคะแนน (Print Report)</span>
          </button>
        </div>
      </div>

      {/* Submissions Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              ประวัติการส่งคำตอบ & คะแนนสะสมของนักเรียน
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              สาขาวิชา: <strong className="text-slate-600 dark:text-slate-300">{selectedMajorFilter === 'all' ? 'ทั้งหมด' : selectedMajorFilter}</strong> • ระดับชั้น: <strong className="text-slate-600 dark:text-slate-300">{selectedRoomFilter === 'all' ? 'ทั้งหมด' : selectedRoomFilter}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              แสดง {filteredSessions.length} รายการ
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setIsReportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์หน้านี้</span>
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <div>ยังไม่มีประวัติการส่งคำตอบที่ตรงกับเงื่อนไขการกรอง</div>
            <p className="text-[11px] text-slate-500">
              ลองเลือกสาขาวิชาหรือระดับชั้นอื่น หรือล้างคำค้นหา
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">ชื่อนักเรียน</th>
                  <th className="py-3 px-3">สาขาวิชา / ห้อง</th>
                  <th className="py-3 px-4">บทเรียนที่เล่น</th>
                  <th className="py-3 px-4 text-center">คะแนนที่ได้ / เต็ม</th>
                  <th className="py-3 px-4 text-center">ถูกหักคะแนนรวม</th>
                  <th className="py-3 px-4">เวลาที่เล่นจบ</th>
                  <th className="py-3 px-4 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((sess) => {
                  const studentUser = usersList.find((u) => u.id === sess.userId || u.name === sess.userName);
                  let totalDeductions = 0;
                  (Object.values(sess.questionAttempts) as QuestionAttempt[]).forEach((att) => {
                    totalDeductions += att.deductedPoints;
                  });

                  return (
                    <tr
                      key={sess.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        <div>{sess.userName}</div>
                        {studentUser?.studentId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {studentUser.studentId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {studentUser?.major || 'วิทยาการคอมพิวเตอร์'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          ห้อง: {studentUser?.gradeLevel || 'ม.4/1'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {sess.moduleTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {sess.totalScore}
                        </span>{' '}
                        / {sess.maxPossibleScore}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {totalDeductions > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            -{totalDeductions} แต้ม
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            0 (เต็มร้อย)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(sess.endTime || sess.startTime).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSession(sess)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          ดู Log คำตอบ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Log รายละเอียดการทำโจทย์: {selectedSession.userName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  บทเรียน: {selectedSession.moduleTitle} • คะแนนรวม: {selectedSession.totalScore} /{' '}
                  {selectedSession.maxPossibleScore}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="space-y-3">
              {(Object.entries(selectedSession.questionAttempts) as [string, QuestionAttempt][]).map(
                ([qId, attempt], idx) => (
                  <div
                    key={qId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        ข้อที่ {idx + 1}:
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          ตอบไป {attempt.attemptsCount} ครั้ง
                        </span>
                        {attempt.deductedPoints > 0 && (
                          <span className="text-rose-500 font-semibold font-mono">
                            (-{attempt.deductedPoints} คะแนน)
                          </span>
                        )}
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          ได้ {attempt.earnedPoints} แต้ม
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 font-mono text-xs p-2.5 rounded-lg overflow-x-auto">
                      <span className="text-slate-400 select-none">$ </span>
                      {attempt.userAnswer || '(ไม่มีคำตอบที่ส่ง)'}
                    </div>

                    {attempt.isCorrect ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านถูกต้อง
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-500 flex items-center gap-1 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> ข้ามหรือไม่ผ่าน
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Score Report Modal */}
      <ScoreReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        sessions={filteredSessions}
        modules={modules}
        usersList={usersList}
        selectedMajorFilter={selectedMajorFilter}
        selectedRoomFilter={selectedRoomFilter}
        selectedModuleFilter={selectedModuleFilter}
        currentUser={currentUser}
        passingThreshold={passingThreshold}
        onPassingThresholdChange={onPassingThresholdChange}
      />
    </div>
  );
};

