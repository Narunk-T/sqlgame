import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  ShieldCheck,
  Plus,
  Check,
  X,
  Lock,
  Mail,
  Hash,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  LogOut,
  UserPlus,
  KeyRound,
  CheckCircle2,
  School,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { registerStudent, getSavedGradeLevels, getSavedMajors, sortThaiAlphabetical } from '../utils/storage';
import { sound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  usersList: UserProfile[];
  gradeLevels?: string[];
  majors?: string[];
  onSelectUser: (user: UserProfile) => void;
  onLogout?: () => void;
  onRefreshUsers?: () => void;
}

const AVATAR_OPTIONS = ['👦', '👧', '🧑‍💻', '👩‍💻', '🎓', '🚀', '🐱', '🦊', '⚡', '🌟', '🎨', '🕹️', '🏆', '💡'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  usersList,
  gradeLevels: propGradeLevels,
  majors: propMajors,
  onSelectUser,
  onLogout,
  onRefreshUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'student_login' | 'student_register' | 'teacher_login'>('student_login');

  // Load configured grade levels and majors (sorted ascending ก-ฮ)
  const availableGradeLevels = sortThaiAlphabetical(
    propGradeLevels && propGradeLevels.length > 0
      ? propGradeLevels
      : getSavedGradeLevels()
  );

  const availableMajors = sortThaiAlphabetical(
    propMajors && propMajors.length > 0
      ? propMajors
      : getSavedMajors()
  );

  // Student Login Form State
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [loginError, setLoginError] = useState<{ type: 'invalid' | 'pending' | 'rejected' | ''; message: string }>({ type: '', message: '' });

  // Teacher Login Form State
  const [teacherUsername, setTeacherUsername] = useState('teacher');
  const [teacherPassword, setTeacherPassword] = useState('password123');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherLoginError, setTeacherLoginError] = useState('');

  // Student Register Form State
  const [regStudentId, setRegStudentId] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regGradeLevel, setRegGradeLevel] = useState(availableGradeLevels[0] || 'ม.4/1');
  const [regMajor, setRegMajor] = useState(availableMajors[0] || 'เทคโนโลยีสารสนเทศ');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAvatar, setRegAvatar] = useState('👦');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Sync regGradeLevel if availableGradeLevels change
  useEffect(() => {
    if (availableGradeLevels.length > 0 && !availableGradeLevels.includes(regGradeLevel)) {
      setRegGradeLevel(availableGradeLevels[0]);
    }
  }, [availableGradeLevels]);

  // Sync regMajor if availableMajors change
  useEffect(() => {
    if (availableMajors.length > 0 && !availableMajors.includes(regMajor)) {
      setRegMajor(availableMajors[0]);
    }
  }, [availableMajors]);

  if (!isOpen) return null;

  const teachers = usersList.filter((u) => u.role === 'teacher');
  const students = usersList.filter((u) => u.role === 'student');

  // Handle Student Login
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError({ type: '', message: '' });

    const cleanUser = studentUsername.trim().toLowerCase();
    const cleanPass = studentPassword.trim();

    if (!cleanUser) {
      setLoginError({ type: 'invalid', message: 'กรุณาระบุ Username หรือ รหัสนักเรียน 11 หลัก' });
      return;
    }

    if (!cleanPass) {
      setLoginError({ type: 'invalid', message: 'กรุณากรอกรหัสผ่าน (Password)' });
      return;
    }

    // Find student matching username or studentId
    const foundStudent = students.find(
      (s) =>
        (s.username || '').toLowerCase() === cleanUser ||
        (s.studentId && s.studentId === cleanUser)
    );

    if (!foundStudent) {
      sound.playWrong();
      setLoginError({
        type: 'invalid',
        message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบ Username หรือสมัครสมาชิกใหม่',
      });
      return;
    }

    // Verify Password (must strictly match student's password or default 'password123')
    const validPassword = foundStudent.password || 'password123';
    if (cleanPass !== validPassword) {
      sound.playWrong();
      setLoginError({
        type: 'invalid',
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง (ค่าเริ่มต้นคือ password123)',
      });
      return;
    }

    // Check Approval Status
    if (foundStudent.status === 'pending') {
      sound.playWrong();
      setLoginError({
        type: 'pending',
        message: `บัญชีของคุณ (${foundStudent.name}) อยู่ระหว่าง "รออาจารย์อนุมัติการใช้งาน" กรุณาติดต่ออาจารย์ผู้สอนเพื่อเปิดสิทธิ์`,
      });
      return;
    }

    if (foundStudent.status === 'rejected') {
      sound.playWrong();
      setLoginError({
        type: 'rejected',
        message: `บัญชีของคุณ (${foundStudent.name}) ถูกปฏิเสธหรือระงับการใช้งาน กรุณาติดต่ออาจารย์ผู้สอน`,
      });
      return;
    }

    // Success!
    sound.playCorrect();
    onSelectUser(foundStudent);
    onClose();
  };

  // Handle Teacher Login
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherLoginError('');

    const cleanUser = teacherUsername.trim().toLowerCase();
    const cleanPass = teacherPassword.trim();

    if (!cleanUser) {
      setTeacherLoginError('กรุณากรอก Username อาจารย์');
      return;
    }

    if (!cleanPass) {
      setTeacherLoginError('กรุณากรอกรหัสผ่านอาจารย์');
      return;
    }

    const foundTeacher = teachers.find(
      (t) =>
        (t.username || 'teacher').toLowerCase() === cleanUser ||
        (t.email || '').toLowerCase() === cleanUser
    );

    if (!foundTeacher) {
      sound.playWrong();
      setTeacherLoginError('ไม่พบบัญชีอาจารย์นี้ในระบบ (เช่น username: teacher)');
      return;
    }

    const validPassword = foundTeacher.password || 'password123';
    if (cleanPass !== validPassword) {
      sound.playWrong();
      setTeacherLoginError('รหัสผ่านอาจารย์ไม่ถูกต้อง (ค่าเริ่มต้นคือ password123)');
      return;
    }

    sound.playCorrect();
    onSelectUser(foundTeacher);
    onClose();
  };

  // Handle Student Registration
  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    // 1. Validate 11-digit Student ID
    const cleanStudentId = regStudentId.trim();
    if (!/^\d{11}$/.test(cleanStudentId)) {
      setRegError('รหัสประจำตัวนักเรียนต้องประกอบด้วยตัวเลข 11 หลักพอดี (เช่น 66010000001)');
      return;
    }

    // 2. Validate Username
    const cleanUsername = regUsername.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setRegError('Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    // 3. Validate Password
    if (regPassword.length < 4) {
      setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    const effectiveGrade = regGradeLevel.trim() || availableGradeLevels[0] || 'ม.4/1';
    const effectiveMajor = regMajor.trim() || availableMajors[0] || 'เทคโนโลยีสารสนเทศ';

    const result = registerStudent({
      studentId: cleanStudentId,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      nickname: regNickname.trim(),
      gradeLevel: effectiveGrade,
      major: effectiveMajor,
      username: cleanUsername,
      password: regPassword,
      email: regEmail.trim(),
      avatar: regAvatar,
    });

    if (!result.success) {
      sound.playWrong();
      setRegError(result.message);
      return;
    }

    sound.playCorrect();
    setRegSuccess(true);
    if (onRefreshUsers) onRefreshUsers();

    // Auto-fill student login form for convenience
    setStudentUsername(cleanUsername);
    setStudentPassword(regPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>เข้าสู่ระบบ / สมัครใช้งาน (SQL Quest Portal)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser
                ? `เข้าสู่ระบบอยู่โดย ${currentUser.name} (${currentUser.role === 'teacher' ? 'อาจารย์' : 'นักเรียน'})`
                : 'กรุณาลงชื่อเข้าใช้ด้วย Username และ Password เพื่อเริ่มใช้งาน'}
            </p>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('student_login');
                setLoginError({ type: '', message: '' });
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'student_login'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>นักเรียน Login</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('student_register');
                setRegError('');
                setRegSuccess(false);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'student_register'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สมัครนักเรียนใหม่</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('teacher_login');
                setTeacherLoginError('');
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'teacher_login'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>อาจารย์ผู้สอน</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Student Login */}
          {activeTab === 'student_login' && (
            <div className="space-y-5">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                {loginError.message && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      loginError.type === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                        : loginError.type === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {loginError.type === 'pending' ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {loginError.type === 'pending'
                          ? '⏳ อยู่ระหว่างรออาจารย์อนุมัติ'
                          : loginError.type === 'rejected'
                          ? '🚫 บัญชีถูกระงับหรือไม่ได้รับอนุมัติ'
                          : 'เข้าสู่ระบบไม่สำเร็จ'}
                      </div>
                      <div className="mt-0.5 text-[11px]">{loginError.message}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Username หรือ รหัสประจำตัวนักเรียน 11 หลัก *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      placeholder="เช่น sompong67 หรือ 66010000001"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Password (รหัสผ่าน) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="รหัสผ่านที่กำหนดตอนสมัคร"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>เข้าสู่ระบบนักเรียน</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('student_register');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  ยังไม่มีบัญชีนักเรียน? คลิกที่นี่เพื่อลงทะเบียนสมัครใหม่
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Student Registration */}
          {activeTab === 'student_register' && (
            <div className="space-y-4">
              {regSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-3xl mx-auto">
                    🎉
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                      ลงทะเบียนสำเร็จเรียบร้อย!
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed max-w-sm mx-auto">
                      ข้อมูลของคุณถูกบันทึกเข้าระบบแล้ว <strong>กรุณารอให้อาจารย์ผู้สอนเป็นผู้อนุญาตการใช้งาน</strong> ก่อน จึงจะสามารถเข้าสู่ระบบเพื่อเล่นเกมได้
                    </p>
                  </div>

                  <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl text-left text-xs font-mono border border-emerald-200 dark:border-emerald-800/80 space-y-1">
                    <div><strong>Username:</strong> {studentUsername}</div>
                    <div><strong>รหัสนักเรียน:</strong> {regStudentId}</div>
                    <div><strong>สาขาวิชา:</strong> {regMajor}</div>
                    <div><strong>ระดับชั้น:</strong> {regGradeLevel}</div>
                    <div><strong>สถานะ:</strong> <span className="text-amber-600 font-bold">⏳ รออาจารย์อนุมัติ (Pending)</span></div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('student_login');
                      setRegSuccess(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    ไปที่หน้าเข้าสู่ระบบ (Student Login)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStudentRegister} className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>กรอกข้อมูลให้ครบถ้วน จากนั้นอาจารย์ผู้สอนจะทำการตรวจสอบและอนุมัติบัญชีของคุณ</span>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Avatar Picker */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      เลือกรูปไอคอนประจำตัว (Avatar)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setRegAvatar(icon);
                          }}
                          className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                            regAvatar === icon
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
                        <span className={`text-[10px] font-mono ${regStudentId.length === 11 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                          {regStudentId.length}/11 หลัก
                        </span>
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          maxLength={11}
                          value={regStudentId}
                          onChange={(e) => setRegStudentId(e.target.value.replace(/\D/g, ''))}
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
                          value={regGradeLevel}
                          onChange={(e) => setRegGradeLevel(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                        >
                          {availableGradeLevels.map((g) => (
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
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
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
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
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
                        value={regNickname}
                        onChange={(e) => setRegNickname(e.target.value)}
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
                        value={regMajor}
                        onChange={(e) => setRegMajor(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                      >
                        {availableMajors.map((m) => (
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
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
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
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
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
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="เช่น sompong@school.ac.th"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ยืนยันการลงทะเบียน (ส่งให้อาจารย์อนุมัติ)</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Teacher Login */}
          {activeTab === 'teacher_login' && (
            <div className="space-y-5">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                {teacherLoginError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{teacherLoginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Username อาจารย์ผู้สอน *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      placeholder="teacher"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Password อาจารย์ผู้สอน *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showTeacherPassword ? 'text' : 'password'}
                      required
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="รหัสผ่านอาจารย์"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    (ค่าเริ่มต้น: User: <code>teacher</code>, Pass: <code>password123</code> หรือแก้ไขได้ในโปรไฟล์อาจารย์)
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>เข้าสู่ระบบอาจารย์ผู้สอน</span>
                </button>
              </form>

              {/* Teacher Accounts Helper - Fill Username only */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    เลือกบัญชีอาจารย์ (เพื่อกรอก Username):
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    รหัสผ่านเริ่มต้น: <span className="font-semibold text-indigo-600 dark:text-indigo-400">password123</span>
                  </div>
                </div>
                {teachers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setTeacherUsername(t.username || 'teacher');
                      setTeacherPassword('');
                      setTeacherLoginError('');
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      teacherUsername === (t.username || 'teacher')
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            อาจารย์
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Username: <code className="text-slate-600 dark:text-slate-300 font-semibold">{t.username || 'teacher'}</code> ({t.email})
                        </div>
                      </div>
                    </div>
                    {teacherUsername === (t.username || 'teacher') && (
                      <Check className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2">
                <span>เข้าสู่ระบบเป็น: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong></span>
                {onLogout && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onLogout();
                    }}
                    className="flex items-center gap-1 text-rose-600 hover:underline font-semibold ml-2 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>ยังไม่ได้เข้าสู่ระบบ — กรุณาป้อน Username และ Password เพื่อเข้าใช้งาน</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
