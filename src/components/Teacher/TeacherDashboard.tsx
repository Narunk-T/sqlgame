import React, { useState, useMemo } from 'react';
import {
  QuizModule,
  Question,
  UserProfile,
  TableData,
  GameSession,
  StudentStats,
} from '../../types';
import { QuestionEditorModal } from './QuestionEditorModal';
import { ModuleEditorModal } from './ModuleEditorModal';
import { StudentSubmissionsView } from './StudentSubmissionsView';
import { StudentManagementView } from './StudentManagementView';
import { DatabaseManagementView } from './DatabaseManagementView';
import { TeacherProfileModal } from './TeacherProfileModal';
import { GradeManagementModal } from './GradeManagementModal';
import { MajorManagementModal } from './MajorManagementModal';
import { sound } from '../../utils/sound';
import { getPassingThreshold, savePassingThreshold } from '../../utils/storage';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  Users,
  Database,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  UserCheck,
  UserCog,
  Search,
  Filter,
  GraduationCap,
  FolderPlus,
  Settings2,
  X,
  Layers,
  CheckCircle2,
  School,
  Sliders,
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: UserProfile;
  modules: QuizModule[];
  tables: Record<string, TableData>;
  sessions: GameSession[];
  leaderboard: StudentStats[];
  usersList: UserProfile[];
  gradeLevels: string[];
  majors: string[];
  onAddGradeLevel: (grade: string) => { success: boolean; message: string; grades: string[] };
  onUpdateGradeLevel: (oldGrade: string, newGrade: string) => { success: boolean; message: string; grades: string[] };
  onDeleteGradeLevel: (grade: string) => { success: boolean; message: string; grades: string[] };
  onResetGradeLevels: () => void;
  onAddMajor: (major: string) => { success: boolean; message: string; majors: string[] };
  onUpdateMajor: (oldMajor: string, newMajor: string) => { success: boolean; message: string; majors: string[] };
  onDeleteMajor: (major: string) => { success: boolean; message: string; majors: string[] };
  onResetMajors: () => void;
  onSaveQuestion: (question: Question, targetModuleId: string) => void;
  onDeleteQuestion: (questionId: string, moduleId: string) => void;
  onDuplicateQuestion: (question: Question, moduleId: string) => void;
  onSaveModule?: (module: QuizModule) => void;
  onDeleteModule?: (moduleId: string) => void;
  onResetModules: () => void;
  onImportModules: (modules: QuizModule[]) => void;
  onOpenTableViewer: (tableName?: string) => void;
  onApproveStudent: (studentId: string) => void;
  onRejectStudent: (studentId: string) => void;
  onSaveStudent: (student: UserProfile) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteAllStudents?: () => void;
  onSaveTeacherProfile: (profile: UserProfile) => void;
  onSaveTable: (newTableData: TableData, oldTableName?: string) => void;
  onDeleteTable: (tableName: string) => void;
  onResetTables: () => void;
  onImportTables: (tables: Record<string, TableData>) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  modules,
  tables,
  sessions,
  leaderboard,
  usersList,
  gradeLevels,
  majors,
  onAddGradeLevel,
  onUpdateGradeLevel,
  onDeleteGradeLevel,
  onResetGradeLevels,
  onAddMajor,
  onUpdateMajor,
  onDeleteMajor,
  onResetMajors,
  onSaveQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onSaveModule,
  onDeleteModule,
  onResetModules,
  onImportModules,
  onOpenTableViewer,
  onApproveStudent,
  onRejectStudent,
  onSaveStudent,
  onDeleteStudent,
  onDeleteAllStudents,
  onSaveTeacherProfile,
  onSaveTable,
  onDeleteTable,
  onResetTables,
  onImportTables,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'students' | 'submissions' | 'database'>('questions');
  
  // Question & Module Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedModuleIdForNew, setSelectedModuleIdForNew] = useState<string>(modules[0]?.id || 'module-1');

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<QuizModule | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGradeManagementOpen, setIsGradeManagementOpen] = useState(false);
  const [isMajorManagementOpen, setIsMajorManagementOpen] = useState(false);

  // Search & Filter State for Modules
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // Teacher Passing Criteria / Passing Threshold State
  const [passingThreshold, setPassingThreshold] = useState<number>(() => getPassingThreshold());

  const handlePassingThresholdChange = (newThreshold: number) => {
    const clamped = Math.max(1, Math.min(100, Math.round(newThreshold)));
    setPassingThreshold(clamped);
    savePassingThreshold(clamped);
  };

  const pendingStudentsCount = usersList.filter(
    (u) => u.role === 'student' && u.status === 'pending'
  ).length;

  // Extract all distinct Majors from database majors state + modules + usersList
  const distinctMajors = useMemo(() => {
    const set = new Set<string>();
    majors.forEach((m) => set.add(m));
    modules.forEach((m) => {
      if (m.targetMajor && m.targetMajor !== 'ทุกสาขาวิชา') set.add(m.targetMajor);
    });
    usersList.forEach((u) => {
      if (u.major && u.major !== 'ทุกสาขาวิชา') set.add(u.major);
    });
    return Array.from(set);
  }, [majors, modules, usersList]);

  // Extract all distinct Rooms/GradeLevels from database gradeLevels state + modules + usersList
  const distinctRooms = useMemo(() => {
    const set = new Set<string>();
    gradeLevels.forEach((g) => set.add(g));
    modules.forEach((m) => {
      if (m.targetGradeLevel && m.targetGradeLevel !== 'ทุกห้อง') set.add(m.targetGradeLevel);
    });
    usersList.forEach((u) => {
      if (u.gradeLevel && u.gradeLevel !== 'ทุกห้อง') set.add(u.gradeLevel);
    });
    return Array.from(set).sort();
  }, [gradeLevels, modules, usersList]);

  // Filter modules based on search and filters
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      // 1. Major filter
      if (filterMajor !== 'all') {
        const modMajor = mod.targetMajor || 'ทุกสาขาวิชา';
        if (modMajor !== 'ทุกสาขาวิชา' && modMajor !== filterMajor) {
          return false;
        }
      }

      // 2. Room filter
      if (filterRoom !== 'all') {
        const modRoom = mod.targetGradeLevel || 'ทุกห้อง';
        if (modRoom !== 'ทุกห้อง' && modRoom !== filterRoom) {
          return false;
        }
      }

      // 3. Difficulty filter
      if (filterDifficulty !== 'all') {
        if (mod.difficulty !== filterDifficulty) {
          return false;
        }
      }

      // 4. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = mod.title.toLowerCase().includes(q);
        const matchDesc = (mod.description || '').toLowerCase().includes(q);
        const matchMajor = (mod.targetMajor || '').toLowerCase().includes(q);
        const matchRoom = (mod.targetGradeLevel || '').toLowerCase().includes(q);
        const matchQuestions = mod.questions.some(
          (ques) =>
            ques.title.toLowerCase().includes(q) ||
            ques.description.toLowerCase().includes(q) ||
            ques.solutionSQL.toLowerCase().includes(q) ||
            ques.targetTable.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchMajor && !matchRoom && !matchQuestions) {
          return false;
        }
      }

      return true;
    });
  }, [modules, filterMajor, filterRoom, filterDifficulty, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || filterMajor !== 'all' || filterRoom !== 'all' || filterDifficulty !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMajor('all');
    setFilterRoom('all');
    setFilterDifficulty('all');
  };

  // Handle Export Questions to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(modules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sql_quest_modules_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportModules(parsed);
          alert('นำเข้าชุดบทเรียนและคำถามสำเร็จเรียบร้อย!');
        } else {
          alert('ไฟล์ JSON ไม่ถูกต้องตามรูปแบบชุดบทเรียน');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenCreateQuestionModal = (moduleId?: string) => {
    setEditingQuestion(null);
    if (moduleId) setSelectedModuleIdForNew(moduleId);
    setIsEditorOpen(true);
  };

  const handleOpenEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setSelectedModuleIdForNew(q.moduleId);
    setIsEditorOpen(true);
  };

  const handleOpenCreateModuleModal = () => {
    setEditingModule(null);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModuleModal = (mod: QuizModule) => {
    setEditingModule(mod);
    setIsModuleModalOpen(true);
  };

  const totalQuestions = modules.reduce((acc, m) => acc + m.questions.length, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Teacher Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ระบบจัดการสำหรับอาจารย์ผู้สอน (Teacher Management Console)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <span>ยินดีต้อนรับ, {currentUser.name}</span>
              <span className="text-2xl">{currentUser.avatar}</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              {currentUser.title || 'อาจารย์ผู้สอนวิชาฐานข้อมูล'} {currentUser.department ? `• ${currentUser.department}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsMajorManagementOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-indigo-300" />
              <span>จัดการสาขาวิชา ({majors.length})</span>
            </button>

            <button
              onClick={() => setIsGradeManagementOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <School className="w-4 h-4 text-indigo-300" />
              <span>จัดการระดับชั้น ({gradeLevels.length})</span>
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
            >
              <UserCog className="w-4 h-4 text-indigo-300" />
              <span>แก้ไขข้อมูลอาจารย์</span>
            </button>

            <button
              onClick={handleOpenCreateModuleModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs border border-indigo-400/30 transition-all shrink-0 cursor-pointer shadow-md"
            >
              <FolderPlus className="w-4 h-4 text-indigo-200" />
              <span>สร้างบทเรียนใหม่</span>
            </button>

            <button
              onClick={() => handleOpenCreateQuestionModal()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/40 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างโจทย์ข้อใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>จัดการชุดบทเรียน & โจทย์ ({modules.length} บท / {totalQuestions} ข้อ)</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>จัดการนักเรียน & อนุมัติ</span>
            {pendingStudentsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'students' ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {pendingStudentsCount} รออนุมัติ
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>คะแนน & การส่งงาน ({sessions.filter((s) => s.isCompleted).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ฐานข้อมูลจำลอง ({Object.keys(tables).length} ตาราง)</span>
          </button>
        </div>

        {/* Global tools for questions tab */}
        {activeTab === 'questions' && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              title="ส่งออกบทเรียนและโจทย์เป็น JSON"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก JSON</span>
            </button>

            <label
              title="นำเข้าไฟล์บทเรียน JSON"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้า JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตบทเรียนและโจทย์ทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                  onResetModules();
                }
              }}
              title="รีเซ็ตบทเรียนกลับเป็นค่าเริ่มต้น"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตโจทย์</span>
            </button>
          </div>
        )}
      </div>

      {/* Teacher Passing Criteria Configuration Toolbar (แถบกำหนดเกณฑ์ผ่านสำหรับอาจารย์ผู้สอน) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">เกณฑ์การตัดสิน / ร้อยละการผ่านเกณฑ์:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs">
                เกณฑ์ปัจจุบัน: {passingThreshold}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กำหนดเกณฑ์ร้อยละคะแนนที่ใช้ประเมินสถานะ "ผ่าน/ไม่ผ่าน" ของนักเรียน และรายงานสรุปผลคะแนนแบบเรียลไทม์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-end md:self-center">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 px-2 font-medium">ค่ามาตรฐาน:</span>
            {[50, 60, 70, 80].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  sound.playClick();
                  handlePassingThresholdChange(preset);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  passingThreshold === preset
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={`ตั้งเกณฑ์ผ่านเป็น ${preset}%`}
              >
                {preset}%
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">กำหนดเอง:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={passingThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 100) {
                    handlePassingThresholdChange(val);
                  }
                }}
                className="w-14 bg-slate-50 dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-mono font-bold text-center text-xs py-1 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Questions & Modules Management */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Search & Filter Control Panel (สาขาวิชา, ห้อง, ระดับความยาก, คำค้นหา) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    ค้นหาและกรองบทเรียน (Search & Filter Modules)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คัดกรองบทเรียนตามสาขาวิชา ห้องเรียน ระดับความยาก หรือคำค้นหา
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors self-start sm:self-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search text */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อบทเรียน, โจทย์, SQL..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Major Filter */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">สาขาวิชา (Major)</label>
                <div className="relative">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={filterMajor}
                    onChange={(e) => setFilterMajor(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="all">ทุกสาขาวิชา (All Majors)</option>
                    {distinctMajors.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room Filter */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ห้อง / ระดับชั้น (Room)</label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={filterRoom}
                    onChange={(e) => setFilterRoom(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="all">ทุกห้อง (All Rooms)</option>
                    {distinctRooms.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5">ระดับความยาก (Difficulty)</label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="all">ทุกระดับความยาก (All Levels)</option>
                  <option value="beginner">ระดับเริ่มต้น (Beginner)</option>
                  <option value="intermediate">ระดับปานกลาง (Intermediate)</option>
                  <option value="advanced">ระดับสูง (Advanced)</option>
                </select>
              </div>
            </div>

            {/* Filter Result Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>
                แสดงผล <strong>{filteredModules.length}</strong> จากทั้งหมด {modules.length} บทเรียน ({filteredModules.reduce((acc, m) => acc + m.questions.length, 0)} ข้อ)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateModuleModal}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างบทเรียนใหม่</span>
                </button>
              </div>
            </div>
          </div>

          {/* Module List */}
          {filteredModules.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                ไม่พบบทเรียนที่ตรงกับเงื่อนไขการค้นหา
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสาขาวิชาและห้องเรียนเพื่อดูบทเรียนทั้งหมด
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* Module Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-3xl shrink-0 p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700">
                      {mod.iconName}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                          {mod.title}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                          {mod.questions.length} ข้อ
                        </span>
                        
                        {/* Target Major Badge */}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-blue-500" />
                          <span>สาขา: {mod.targetMajor || 'ทุกสาขาวิชา'}</span>
                        </span>

                        {/* Target Room Badge */}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
                          <Users className="w-3 h-3 text-purple-500" />
                          <span>ห้อง: {mod.targetGradeLevel || 'ทุกห้อง'}</span>
                        </span>

                        {/* Difficulty Badge */}
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          mod.difficulty === 'beginner'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : mod.difficulty === 'intermediate'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {mod.difficulty === 'beginner' ? 'ระดับเริ่มต้น' : mod.difficulty === 'intermediate' ? 'ระดับปานกลาง' : 'ระดับสูง'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this module */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditModuleModal(mod)}
                      title="แก้ไขข้อมูลบทเรียนและกลุ่มเป้าหมาย"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>แก้ไขบทเรียน</span>
                    </button>

                    <button
                      onClick={() => handleOpenCreateQuestionModal(mod.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มโจทย์</span>
                    </button>

                    {onDeleteModule && modules.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`คุณต้องการลบบทเรียน "${mod.title}" พร้อมโจทย์ทั้งหมดในบทนี้ใช่หรือไม่?`)) {
                            onDeleteModule(mod.id);
                          }
                        }}
                        title="ลบบทเรียนนี้"
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Questions List inside this module */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mod.questions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      ยังไม่มีโจทย์ในบทนี้ คลิกปุ่ม "เพิ่มโจทย์" ด้านบนเพื่อเริ่มสร้างคำถาม
                    </div>
                  ) : (
                    mod.questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                              {qIdx + 1}
                            </span>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              {q.title}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              q.type === 'free_type' || q.type === 'free_text'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold'
                                : q.type === 'drag_drop'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              {q.type === 'free_type' || q.type === 'free_text'
                                ? '⚡ พิมพ์คำสั่งสด (Free-Text)'
                                : q.type === 'drag_drop'
                                ? '🎮 ลากวางคำสั่ง'
                                : '✏️ เติมคำในช่องว่าง'}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold">
                              {q.basePoints} คะแนน (หักครั้งละ -{q.penaltyPerWrong !== undefined ? q.penaltyPerWrong : 1})
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              ตาราง: {q.targetTable}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {q.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg w-fit max-w-full truncate border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">เฉลย:</span>
                            <span className="truncate">{q.solutionSQL}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleOpenEditQuestionModal(q)}
                            title="แก้ไขโจทย์"
                            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicateQuestion(q, mod.id)}
                            title="คัดลอกโจทย์"
                            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`ต้องการลบโจทย์ "${q.title}" ใช่หรือไม่?`)) {
                                onDeleteQuestion(q.id, mod.id);
                              }
                            }}
                            title="ลบโจทย์"
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Student Management & Approvals */}
      {activeTab === 'students' && (
        <StudentManagementView
          usersList={usersList}
          leaderboard={leaderboard}
          gradeLevels={gradeLevels}
          majors={majors}
          onOpenGradeManagement={() => setIsGradeManagementOpen(true)}
          onOpenMajorManagement={() => setIsMajorManagementOpen(true)}
          onApproveStudent={onApproveStudent}
          onRejectStudent={onRejectStudent}
          onSaveStudent={onSaveStudent}
          onDeleteStudent={onDeleteStudent}
          onDeleteAllStudents={onDeleteAllStudents}
        />
      )}

      {/* Tab 3: Submissions & Analytics & Printable Score Report */}
      {activeTab === 'submissions' && (
        <StudentSubmissionsView
          sessions={sessions}
          modules={modules}
          leaderboard={leaderboard}
          usersList={usersList}
          gradeLevels={gradeLevels}
          majors={majors}
          currentUser={currentUser}
          passingThreshold={passingThreshold}
          onPassingThresholdChange={handlePassingThresholdChange}
        />
      )}

      {/* Tab 4: Database Tables Management */}
      {activeTab === 'database' && (
        <DatabaseManagementView
          tables={tables}
          onSaveTable={onSaveTable}
          onDeleteTable={onDeleteTable}
          onResetTables={onResetTables}
          onImportTables={onImportTables}
          onOpenTableViewer={onOpenTableViewer}
        />
      )}

      {/* Major Management Modal */}
      <MajorManagementModal
        isOpen={isMajorManagementOpen}
        onClose={() => setIsMajorManagementOpen(false)}
        majors={majors}
        usersList={usersList}
        onAddMajor={onAddMajor}
        onUpdateMajor={onUpdateMajor}
        onDeleteMajor={onDeleteMajor}
        onResetMajors={onResetMajors}
      />

      {/* Grade Levels Management Modal */}
      <GradeManagementModal
        isOpen={isGradeManagementOpen}
        onClose={() => setIsGradeManagementOpen(false)}
        gradeLevels={gradeLevels}
        usersList={usersList}
        onAddGradeLevel={onAddGradeLevel}
        onUpdateGradeLevel={onUpdateGradeLevel}
        onDeleteGradeLevel={onDeleteGradeLevel}
        onResetGradeLevels={onResetGradeLevels}
      />

      {/* Question Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSaveQuestion={onSaveQuestion}
        modules={modules}
        tables={tables}
        editingQuestion={editingQuestion}
        defaultModuleId={selectedModuleIdForNew}
      />

      {/* Module Editor Modal */}
      {onSaveModule && (
        <ModuleEditorModal
          isOpen={isModuleModalOpen}
          onClose={() => {
            setIsModuleModalOpen(false);
            setEditingModule(null);
          }}
          onSaveModule={onSaveModule}
          editingModule={editingModule}
          existingModules={modules}
          gradeLevels={gradeLevels}
          majors={majors}
        />
      )}

      {/* Teacher Profile Edit Modal */}
      <TeacherProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        teacher={currentUser}
        onSaveProfile={onSaveTeacherProfile}
      />
    </div>
  );
};
