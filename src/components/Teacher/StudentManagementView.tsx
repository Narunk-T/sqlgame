import React, { useState, useMemo } from 'react';
import { UserProfile, UserStatus, StudentStats } from '../../types';
import { StudentEditModal } from './StudentEditModal';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Filter,
  Check,
  X,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Hash,
  Mail,
  Calendar,
  School,
  UserX,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { sortThaiAlphabetical, getSavedGradeLevels, getSavedMajors } from '../../utils/storage';

interface StudentManagementViewProps {
  usersList: UserProfile[];
  leaderboard: StudentStats[];
  gradeLevels?: string[];
  majors?: string[];
  onOpenGradeManagement?: () => void;
  onOpenMajorManagement?: () => void;
  onApproveStudent: (studentId: string) => void;
  onRejectStudent: (studentId: string) => void;
  onSaveStudent: (student: UserProfile) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteAllStudents?: () => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  usersList,
  leaderboard,
  gradeLevels,
  majors,
  onOpenGradeManagement,
  onOpenMajorManagement,
  onApproveStudent,
  onRejectStudent,
  onSaveStudent,
  onDeleteStudent,
  onDeleteAllStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [majorFilter, setMajorFilter] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<UserProfile | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
  // Custom Confirmation Dialog States (Replaces window.confirm for iframe safety)
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);
  const [isApproveAllConfirmOpen, setIsApproveAllConfirmOpen] = useState(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [deleteAllAck, setDeleteAllAck] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const students = usersList.filter((u) => u.role === 'student');

  // Stats
  const totalCount = students.length;
  const pendingStudents = students.filter((s) => s.status === 'pending');
  const approvedCount = students.filter((s) => s.status === 'approved').length;
  const rejectedCount = students.filter((s) => s.status === 'rejected').length;

  // Grade options dynamically derived from database gradeLevels + active students (sorted ascending ก-ฮ)
  const availableGrades = useMemo(() => {
    const set = new Set<string>(gradeLevels && gradeLevels.length > 0 ? gradeLevels : getSavedGradeLevels());
    students.forEach((s) => {
      if (s.gradeLevel && s.gradeLevel.trim()) set.add(s.gradeLevel.trim());
    });
    return sortThaiAlphabetical(Array.from(set));
  }, [gradeLevels, students]);

  // Major options dynamically derived from database majors + active students (sorted ascending ก-ฮ)
  const availableMajors = useMemo(() => {
    const set = new Set<string>(majors && majors.length > 0 ? majors : getSavedMajors());
    students.forEach((s) => {
      if (s.major && s.major.trim()) set.add(s.major.trim());
    });
    return sortThaiAlphabetical(Array.from(set));
  }, [majors, students]);

  // Filtered students
  const filteredStudents = students.filter((s) => {
    // Status filter
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;

    // Grade filter
    if (gradeFilter !== 'all' && s.gradeLevel !== gradeFilter) return false;

    // Major filter
    if (majorFilter !== 'all' && s.major !== majorFilter) return false;

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const matchName = s.name.toLowerCase().includes(term);
      const matchFirst = (s.firstName || '').toLowerCase().includes(term);
      const matchLast = (s.lastName || '').toLowerCase().includes(term);
      const matchNick = (s.nickname || '').toLowerCase().includes(term);
      const matchId = (s.studentId || '').toLowerCase().includes(term);
      const matchUser = (s.username || '').toLowerCase().includes(term);
      const matchEmail = (s.email || '').toLowerCase().includes(term);
      const matchGrade = (s.gradeLevel || '').toLowerCase().includes(term);
      const matchMajor = (s.major || '').toLowerCase().includes(term);

      return matchName || matchFirst || matchLast || matchNick || matchId || matchUser || matchEmail || matchGrade || matchMajor;
    }

    return true;
  });

  const togglePasswordReveal = (studentId: string) => {
    sound.playClick();
    setRevealedPasswords((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleOpenAddModal = () => {
    setSelectedStudentForEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (student: UserProfile) => {
    setSelectedStudentForEdit(student);
    setIsEditModalOpen(true);
  };

  const handleApprove = (studentId: string, name: string) => {
    sound.playCorrect();
    onApproveStudent(studentId);
    showToast('success', `อนุมัติบัญชีนักเรียน "${name}" เรียบร้อยแล้ว`);
  };

  const handleReject = (studentId: string) => {
    sound.playClick();
    onRejectStudent(studentId);
    showToast('info', 'ระงับสิทธิ์การใช้งานของนักเรียนแล้ว');
  };

  const handleRequestDelete = (student: UserProfile) => {
    sound.playClick();
    setStudentToDelete(student);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.name;
    sound.playClick();
    onDeleteStudent(studentToDelete.id);
    showToast('success', `ลบบัญชีนักเรียน "${name}" ออกจากระบบเรียบร้อยแล้ว`);
    setStudentToDelete(null);
  };

  const handleRequestDeleteAll = () => {
    if (students.length === 0) {
      showToast('info', 'ไม่มีข้อมูลนักเรียนในระบบ');
      return;
    }
    sound.playClick();
    setDeleteAllAck(false);
    setIsDeleteAllConfirmOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    if (!onDeleteAllStudents) return;
    const count = students.length;
    sound.playCorrect();
    onDeleteAllStudents();
    setIsDeleteAllConfirmOpen(false);
    showToast('success', `ล้างข้อมูลนักเรียนทั้งหมด ${count} คน พร้อมประวัติคะแนนสำหรับเริ่มภาคเรียนใหม่เรียบร้อยแล้ว`);
  };

  const handleRequestApproveAll = () => {
    if (pendingStudents.length === 0) return;
    sound.playClick();
    setIsApproveAllConfirmOpen(true);
  };

  const handleConfirmApproveAll = () => {
    sound.playCorrect();
    const count = pendingStudents.length;
    pendingStudents.forEach((s) => onApproveStudent(s.id));
    showToast('success', `อนุมัติให้นักเรียนทั้งหมด ${count} คน เข้าสู่ระบบเรียบร้อยแล้ว`);
    setIsApproveAllConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">นักเรียนทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount} คน</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs transition-all ${
          pendingStudents.length > 0
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>รออาจารย์อนุมัติ</span>
            </span>
            {pendingStudents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                รอตรวจสอบ
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingStudents.length} คน
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>อนุมัติแล้ว (ใช้งานได้)</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount} คน</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>ปฏิเสธ/ระงับ</span>
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1">{rejectedCount} คน</div>
        </div>
      </div>

      {/* Pending Banner Alert if any */}
      {pendingStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ⏳
            </div>
            <div>
              <div className="font-bold text-sm text-amber-900 dark:text-amber-200">
                มีนักเรียนลงทะเบียนใหม่ {pendingStudents.length} คน กำลังรอให้อาจารย์เป็นผู้อนุญาต
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                นักเรียนจะยังไม่สามารถ Login เข้าสู่ระบบได้จนกว่าอาจารย์จะกดปุ่ม "อนุมัติ"
              </div>
            </div>
          </div>
          <button
            onClick={handleRequestApproveAll}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>อนุมัติทุกคน ({pendingStudents.length})</span>
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสนักเรียน 11 หลัก, username, ระดับชั้น..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenMajorManagement && (
              <button
                onClick={onOpenMajorManagement}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>จัดการสาขาวิชา ({majors?.length || 0})</span>
              </button>
            )}

            {onOpenGradeManagement && (
              <button
                onClick={onOpenGradeManagement}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
              >
                <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>จัดการระดับชั้น ({gradeLevels?.length || 0})</span>
              </button>
            )}

            {/* Delete All Students (New Semester) Button */}
            {onDeleteAllStudents && (
              <button
                onClick={handleRequestDeleteAll}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800/80 transition-all cursor-pointer"
                title="ลบข้อมูลนักเรียนทั้งหมดเพื่อเตรียมความพร้อมสำหรับเริ่มภาคเรียนใหม่"
              >
                <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="hidden md:inline">ลบนักเรียนทั้งหมด (เริ่มภาคเรียนใหม่)</span>
                <span className="md:hidden">ลบทั้งหมด</span>
              </button>
            )}

            {/* Add Student Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มนักเรียนใหม่</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mr-1">
              สถานะ:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <span>รออนุมัติ</span>
              {pendingStudents.length > 0 && (
                <span className="px-1.5 py-0.2 bg-white/30 rounded-full text-[10px]">
                  {pendingStudents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              อนุมัติแล้ว ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              ปฏิเสธ/ระงับ ({rejectedCount})
            </button>
          </div>

          {/* Major Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              สาขาวิชา:
            </span>
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden dark:text-slate-200 font-medium"
            >
              <option value="all">ทุกสาขาวิชา</option>
              {availableMajors.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Grade Dropdown */}
          {availableGrades.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                ระดับชั้น:
              </span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden dark:text-slate-200 font-medium"
              >
                <option value="all">ทุกระดับชั้น</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไข
            </div>
            <p className="text-xs text-slate-400">
              ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ หรือคลิกปุ่มเพิ่มนักเรียนใหม่
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">นักเรียน</th>
                  <th className="py-3 px-3">รหัสประจำตัว</th>
                  <th className="py-3 px-3">สาขาวิชา</th>
                  <th className="py-3 px-3">ระดับชั้น</th>
                  <th className="py-3 px-3">Username / รหัสผ่าน</th>
                  <th className="py-3 px-3">คะแนนสะสม</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredStudents.map((s) => {
                  const studentStat = leaderboard.find((lb) => lb.userId === s.id);
                  const isPending = s.status === 'pending';
                  const isApproved = s.status === 'approved';
                  const isRejected = s.status === 'rejected';
                  const isPasswordRevealed = revealedPasswords[s.id];

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isPending ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                            {s.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              {s.nickname && (
                                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                  ({s.nickname})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              {s.email ? (
                                <span>{s.email}</span>
                              ) : (
                                <span>สมัครเมื่อ: {s.createdAt ? s.createdAt.substring(0, 10) : '-'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 11-digit Student ID */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          {s.studentId || '-'}
                        </span>
                      </td>

                      {/* Major */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium text-[11px]">
                          {s.major || 'วิทยาการคอมพิวเตอร์'}
                        </span>
                      </td>

                      {/* Grade Level */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {s.gradeLevel || '-'}
                        </span>
                      </td>

                      {/* Username & Password */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400 mr-1">User:</span>
                            <span className="font-semibold">{s.username || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="text-slate-400 mr-1">Pass:</span>
                            <span>{isPasswordRevealed ? (s.password || '-') : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(s.id)}
                              title={isPasswordRevealed ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5"
                            >
                              {isPasswordRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {studentStat?.totalScore || 0} pts
                        </div>
                        <div className="text-[10px] text-slate-400">
                          จบ {studentStat?.quizzesCompleted || 0} ด่าน
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>รอครูอนุมัติ</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>ปฏิเสธ/ระงับ</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve / Reject buttons */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(s.id, s.name)}
                                title="อนุมัติให้นักเรียนเข้าใช้งาน"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                              <button
                                onClick={() => handleReject(s.id)}
                                title="ปฏิเสธการลงทะเบียน"
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleReject(s.id)}
                              title="ระงับการใช้งานชั่วคราว"
                              className="px-2 py-1 rounded-lg text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              ระงับ
                            </button>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(s.id, s.name)}
                              title="เปิดสิทธิ์และอนุมัติการใช้งานใหม่"
                              className="px-2 py-1 rounded-lg text-[11px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 transition-colors font-bold"
                            >
                              เปิดสิทธิ์
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            title="แก้ไขข้อมูลนักเรียน"
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleRequestDelete(s)}
                            title="ลบบัญชีนักเรียน"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Edit / Add Modal */}
      <StudentEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudentForEdit}
        onSaveStudent={onSaveStudent}
        existingUsers={usersList}
        gradeLevels={gradeLevels}
        majors={majors}
      />

      {/* Custom Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ยืนยันการลบข้อมูลนักเรียน
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  โปรดตรวจสอบข้อมูลก่อนยืนยันการลบออกจากระบบ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Student Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  {studentToDelete.avatar || '👨‍🎓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {studentToDelete.name} {studentToDelete.nickname ? `(${studentToDelete.nickname})` : ''}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    รหัส: {studentToDelete.studentId || '-'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {studentToDelete.major || '-'} • ห้อง {studentToDelete.gradeLevel || '-'}
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block mb-0.5">คำเตือน: ข้อมูลจะถูกลบถาวร</span>
                  บัญชีผู้ใช้, รหัสผ่าน, ข้อมูลส่วนตัว และประวัติคะแนนการทำแบบทดสอบทั้งหมดของนักเรียนคนนี้จะถูกลบออกจากระบบทันทีและไม่สามารถกู้คืนได้
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบข้อมูลนักเรียน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approve All Modal */}
      {isApproveAllConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  อนุมัติการเข้าใช้งานทุกคน
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  อนุมัติให้นักเรียนที่รออยู่ทั้งหมด {pendingStudents.length} คน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveAllConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                ต้องการอนุมัติให้นักเรียนที่รออยู่ทั้งหมด <strong className="text-emerald-600 font-bold">{pendingStudents.length} คน</strong> สามารถเข้าสู่ระบบเพื่อเริ่มทำแบบฝึกหัดและเข้าเรียนได้ทันทีหรือไม่?
              </p>
            </div>
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsApproveAllConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveAll}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ยืนยันอนุมัติทุกคน ({pendingStudents.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete ALL Students Modal (New Semester Clear) */}
      {isDeleteAllConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start gap-3 p-5 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/40">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">
                  ยืนยันลบข้อมูลนักเรียนทั้งหมด (เริ่มภาคเรียนใหม่)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  การดำเนินการนี้จะลบรายชื่อนักเรียนและประวัติการส่งงานทั้งหมดเพื่อเตรียมรับนักเรียนรุ่นใหม่
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAllConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>ข้อมูลที่จะได้รับผลกระทบ:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  <li>บัญชีนักเรียนทั้งหมด <strong className="text-rose-600 font-bold">{students.length} คน</strong> จะถูกลบถาวร</li>
                  <li>ประวัติการทำแบบทดสอบและการส่งงานของนักเรียนทั้งหมดจะถูกล้าง</li>
                  <li><strong className="text-emerald-700 dark:text-emerald-400">ปลอดภัย:</strong> บัญชีอาจารย์ผู้สอน, ชุดข้อสอบ, บทเรียน และตารางฐานข้อมูลตัวอย่างจะไม่ถูกลบ</li>
                </ul>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteAllAck}
                  onChange={(e) => setDeleteAllAck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  ฉันเข้าใจและยืนยันว่าต้องการลบข้อมูลนักเรียนทั้งหมด <strong>({students.length} คน)</strong> เพื่อเคลียร์ระบบสำหรับภาคเรียนใหม่
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteAllConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!deleteAllAck}
                onClick={handleConfirmDeleteAll}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                  deleteAllAck
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/25 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบข้อมูลนักเรียนทั้งหมด ({students.length} คน)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20'
              : 'bg-slate-800 text-white border-slate-700 shadow-slate-900/20'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
