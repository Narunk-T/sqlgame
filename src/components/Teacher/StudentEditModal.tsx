import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserStatus } from '../../types';
import {
  X,
  Save,
  AlertCircle,
  Mail,
  Hash,
  UserCheck,
  Clock,
  Ban,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { getSavedGradeLevels, getSavedMajors, sortThaiAlphabetical } from '../../utils/storage';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile | null; // If null, create new student
  onSaveStudent: (student: UserProfile) => void;
  existingUsers: UserProfile[];
  gradeLevels?: string[];
  majors?: string[];
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '👩‍💻', '🦁', '🦊', '🐼', '🚀', '👦', '👧', '🎓', '⚡'];

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveStudent,
  existingUsers,
  gradeLevels: propGradeLevels,
  majors: propMajors,
}) => {
  const isEditing = Boolean(student);

  // Compute sorted available grade levels and majors
  const activeGradeLevels = useMemo(() => {
    const list = propGradeLevels && propGradeLevels.length > 0 ? propGradeLevels : getSavedGradeLevels();
    const unique = new Set<string>(list);
    if (student?.gradeLevel && student.gradeLevel.trim()) {
      unique.add(student.gradeLevel.trim());
    }
    return sortThaiAlphabetical(Array.from(unique));
  }, [propGradeLevels, student?.gradeLevel]);

  const activeMajors = useMemo(() => {
    const list = propMajors && propMajors.length > 0 ? propMajors : getSavedMajors();
    const unique = new Set<string>(list);
    if (student?.major && student.major.trim()) {
      unique.add(student.major.trim());
    }
    return sortThaiAlphabetical(Array.from(unique));
  }, [propMajors, student?.major]);

  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gradeLevel, setGradeLevel] = useState(activeGradeLevels[0] || 'ม.4/1');
  const [major, setMajor] = useState(activeMajors[0] || 'เทคโนโลยีสารสนเทศ');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('👨‍🎓');
  const [status, setStatus] = useState<UserStatus>('approved');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (student) {
      setStudentId(student.studentId || '');
      setFirstName(student.firstName || student.name.split(' ')[0] || '');
      setLastName(student.lastName || student.name.split(' ').slice(1).join(' ') || '');
      setNickname(student.nickname || '');
      setGradeLevel(student.gradeLevel || activeGradeLevels[0] || 'ม.4/1');
      setMajor(student.major || activeMajors[0] || 'เทคโนโลยีสารสนเทศ');
      setUsername(student.username || '');
      setPassword(student.password || 'password123');
      setEmail(student.email || '');
      setAvatar(student.avatar || '👨‍🎓');
      setStatus(student.status || 'approved');
    } else {
      setStudentId('');
      setFirstName('');
      setLastName('');
      setNickname('');
      setGradeLevel(activeGradeLevels[0] || 'ม.4/1');
      setMajor(activeMajors[0] || 'เทคโนโลยีสารสนเทศ');
      setUsername('');
      setPassword('password123');
      setEmail('');
      setAvatar('👨‍🎓');
      setStatus('approved');
    }
    setErrorMessage('');
  }, [student, isOpen, activeGradeLevels, activeMajors]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate 11-digit Student ID
    const cleanStudentId = studentId.trim();
    if (!/^\d{11}$/.test(cleanStudentId)) {
      sound.playWrong();
      setErrorMessage('รหัสประจำตัวนักเรียนต้องประกอบด้วยตัวเลข 11 หลักพอดี (เช่น 66010000001)');
      return;
    }

    // Check duplicate studentId
    const dupId = existingUsers.find(
      (u) => u.id !== student?.id && u.studentId === cleanStudentId
    );
    if (dupId) {
      sound.playWrong();
      setErrorMessage(`รหัสประจำตัวนักเรียน "${cleanStudentId}" ซ้ำกับนักเรียนคนอื่น (${dupId.name})`);
      return;
    }

    // 2. Validate First Name, Last Name, Nickname
    if (!firstName.trim()) {
      sound.playWrong();
      setErrorMessage('กรุณากรอกชื่อนักเรียน');
      return;
    }
    if (!lastName.trim()) {
      sound.playWrong();
      setErrorMessage('กรุณากรอกนามสกุลนักเรียน');
      return;
    }
    if (!nickname.trim()) {
      sound.playWrong();
      setErrorMessage('กรุณากรอกชื่อเล่นนักเรียน');
      return;
    }

    // 3. Validate Username
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      sound.playWrong();
      setErrorMessage('Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    const dupUser = existingUsers.find(
      (u) => u.id !== student?.id && (u.username || '').toLowerCase() === cleanUsername
    );
    if (dupUser) {
      sound.playWrong();
      setErrorMessage(`Username "${cleanUsername}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`);
      return;
    }

    // 4. Validate Password
    if (password.length < 4) {
      sound.playWrong();
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    const effectiveGrade = gradeLevel.trim() || activeGradeLevels[0] || 'ม.4/1';
    const effectiveMajor = major.trim() || activeMajors[0] || 'เทคโนโลยีสารสนเทศ';
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const savedUser: UserProfile = {
      id: student?.id || `student-${Date.now()}`,
      role: 'student',
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      studentId: cleanStudentId,
      gradeLevel: effectiveGrade,
      major: effectiveMajor,
      username: cleanUsername,
      password: password || 'password123',
      email: email.trim(),
      avatar: avatar,
      status: status,
      createdAt: student?.createdAt || dateStr,
      approvedAt: status === 'approved' ? (student?.approvedAt || dateStr) : undefined,
    };

    sound.playCorrect();
    onSaveStudent(savedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-xs">
              {avatar}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isEditing ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่โดยอาจารย์'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? `รหัสนักเรียน: ${student?.studentId || '-'}` : 'กรอกข้อมูลนักเรียนเพื่อลงทะเบียนเข้าสู่ระบบ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Identical fields and structure to Student Registration */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* เลือกไอคอนโปรไฟล์ (Avatar) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              เลือกไอคอนโปรไฟล์ (Avatar)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAvatar(icon);
                  }}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                    avatar === icon
                      ? 'bg-blue-100 dark:bg-blue-950 border-2 border-blue-600 scale-105 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 1. รหัสประจำตัวนักเรียน 11 หลัก & 5. ระดับชั้น */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                <span>1. รหัสประจำตัวนักเรียน (11 หลัก) *</span>
                <span className={`text-[10px] font-mono ${studentId.length === 11 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {studentId.length}/11 หลัก
                </span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                  placeholder="เช่น 66010000001"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                <span>5. ระดับชั้น (Grade / Class) *</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">ตามที่ครูกำหนด</span>
              </label>
              <div className="relative">
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                >
                  {activeGradeLevels.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. ชื่อ, 3. นามสกุล, 4. ชื่อเล่น */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                2. ชื่อ (First Name) *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="สมปอง"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                3. นามสกุล *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ยอดขยัน"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                4. ชื่อเล่น *
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ปอง"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* 6. สาขาวิชา (Major) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
              <span>6. สาขาวิชา (Major / Field of Study) *</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">เลือกจากรายการ</span>
            </label>
            <div className="relative">
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              >
                {activeMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 7. Username & 8. Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                7. Username (ใช้ Login) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="เช่น sompong67"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                8. Password (รหัสผ่าน) *
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กำหนดรหัสผ่าน"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* 9. Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              9. อีเมล (Email) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น sompong@school.ac.th"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* สถานะบัญชีการใช้งาน (สำหรับอาจารย์จัดการ) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              สถานะบัญชีการใช้งาน (Account Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'approved'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>อนุมัติแล้ว</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>รออนุมัติ</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'rejected'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                <span>ระงับการใช้</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
