import React from 'react';
import { UserProfile } from '../types';
import {
  Sparkles,
  BookOpen,
  Database,
  User,
  Volume2,
  VolumeX,
  GraduationCap,
  ShieldCheck,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onOpenCheatsheet: () => void;
  onOpenDatabaseViewer: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenCheatsheet,
  onOpenDatabaseViewer,
  soundEnabled,
  onToggleSound,
  onNavigateHome,
  onLogout,
}) => {
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-mono font-black text-base">
            SQL
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              <span>SQL Quest</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Game
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              เกมสอนและฝึกเขียนภาษา SQL แบบโต้ตอบ
            </div>
          </div>
        </button>

        {/* Global Action Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SQL Cheatsheet Button */}
          <button
            onClick={onOpenCheatsheet}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="เปิดคู่มือสรุปคำสั่ง SQL"
          >
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">คู่มือ SQL</span>
          </button>

          {/* Database Explorer Button */}
          <button
            onClick={onOpenDatabaseViewer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="สำรวจฐานข้อมูลจำลอง"
          >
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">ตารางข้อมูล</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          {/* User Session Area */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Profile Chip */}
              <button
                onClick={onOpenAuthModal}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isTeacher
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                    : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                }`}
                title="คลิกเพื่อดูโปรไฟล์หรือสลับบัญชี"
              >
                <span className="text-xl">{currentUser.avatar}</span>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                    {isTeacher ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        <span>อาจารย์ผู้สอน</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                        <span>นักเรียน</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* Explicit Log Out Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                title="ออกจากระบบ (Log Out)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
