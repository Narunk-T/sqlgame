import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  User,
  Mail,
  Lock,
  Briefcase,
  Save,
  CheckCircle2,
  Sparkles,
  Shield,
  Key,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

const AVATAR_OPTIONS = ['👨‍🏫', '👩‍🏫', '🧑‍💻', '👩‍💻', '🎓', '👑', '⚡', '🌟', '🧙‍♂️', '🦉', '🎯', '🏛️'];

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSaveProfile,
}) => {
  const [firstName, setFirstName] = useState(teacher.firstName || teacher.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(teacher.lastName || teacher.name.split(' ').slice(1).join(' ') || '');
  const [nickname, setNickname] = useState(teacher.nickname || 'ครูสมชาย');
  const [username, setUsername] = useState(teacher.username || 'teacher');
  const [password, setPassword] = useState(teacher.password || 'password123');
  const [email, setEmail] = useState(teacher.email || '');
  const [title, setTitle] = useState(teacher.title || 'อาจารย์ผู้สอนวิชาฐานข้อมูล');
  const [department, setDepartment] = useState(teacher.department || 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
  const [avatar, setAvatar] = useState(teacher.avatar || '👨‍🏫');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCorrect();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const updated: UserProfile = {
      ...teacher,
      name: fullName || teacher.name,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      username: username.trim().toLowerCase(),
      password: password,
      email: email.trim(),
      title: title.trim(),
      department: department.trim(),
      avatar: avatar,
    };

    onSaveProfile(updated);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 flex items-center justify-center text-xl shadow-md border border-indigo-400/30">
              {avatar}
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>แก้ไขข้อมูลโปรไฟล์อาจารย์ผู้สอน</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                  Teacher Profile
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                ปรับปรุงข้อมูลส่วนตัว ข้อมูลประจำวิชา และรหัสผ่านสำหรับเข้าสู่ระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Avatar Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              เลือกรูปไอคอนประจำตัว (Avatar)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAvatar(icon);
                  }}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                    avatar === icon
                      ? 'bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-600 scale-105 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ชื่อ (First Name) *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="เช่น สมชาย"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                นามสกุล (Last Name) *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="เช่น ใจดี"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* Nickname & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ชื่อเรียก / คำนำหน้า
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น ครูสมชาย / อ.ดร.สมชาย"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                อีเมลติดต่อ (Email) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น somchai@school.ac.th"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* Title & Department */}
          <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>ตำแหน่งและกลุ่มสาระวิชา</span>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                ตำแหน่ง / วิทยฐานะ
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น อาจารย์ชำนาญการพิเศษ สาขาวิชาวิทยาการคอมพิวเตอร์"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                กลุ่มสาระ / คณะ / สาขาวิชา
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
            </div>
          </div>

          {/* Security & Credentials */}
          <div className="space-y-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span>ข้อมูลเข้าสู่ระบบของอาจารย์ (Teacher Login Credentials)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Username (ชื่อผู้ใช้) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="teacher"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Password (รหัสผ่าน) *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านเข้าสู่ระบบ"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden dark:text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {showSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>บันทึกการแก้ไขข้อมูลอาจารย์ผู้สอนสำเร็จเรียบร้อย!</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
