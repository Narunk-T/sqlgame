import React, { useState, useEffect } from 'react';
import { QuizModule, DifficultyLevel } from '../../types';
import {
  X,
  BookOpen,
  GraduationCap,
  Users,
  Sparkles,
  Save,
  Check,
  Tag,
  Layers,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { getSavedGradeLevels, getSavedMajors, sortThaiAlphabetical } from '../../utils/storage';

interface ModuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveModule: (module: QuizModule) => void;
  editingModule?: QuizModule | null;
  existingModules: QuizModule[];
  gradeLevels?: string[];
  majors?: string[];
}

const ICON_PRESETS = ['🗄️', '🔍', '📊', '⚡', '🔗', '🔥', '🏆', '🚀', '💻', '🧠', '💡', '🛡️', '📚', '🎯', '⚙️', '✨'];

export const ModuleEditorModal: React.FC<ModuleEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveModule,
  editingModule,
  existingModules,
  gradeLevels: propGradeLevels,
  majors: propMajors,
}) => {
  const isEditing = Boolean(editingModule);
  const activeRooms = [
    'ทุกห้อง',
    ...sortThaiAlphabetical(propGradeLevels && propGradeLevels.length > 0 ? propGradeLevels : getSavedGradeLevels()),
  ];
  const activeMajors = [
    'ทุกสาขาวิชา',
    ...sortThaiAlphabetical(propMajors && propMajors.length > 0 ? propMajors : getSavedMajors()),
  ];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('🗄️');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [targetMajor, setTargetMajor] = useState('ทุกสาขาวิชา');
  const [customMajor, setCustomMajor] = useState('');
  const [targetGradeLevel, setTargetGradeLevel] = useState('ทุกห้อง');
  const [customRoom, setCustomRoom] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editingModule) {
      setTitle(editingModule.title);
      setDescription(editingModule.description || '');
      setIconName(editingModule.iconName || '🗄️');
      setDifficulty(editingModule.difficulty || 'beginner');
      
      const majorVal = editingModule.targetMajor || 'ทุกสาขาวิชา';
      if (activeMajors.includes(majorVal)) {
        setTargetMajor(majorVal);
        setCustomMajor('');
      } else {
        setTargetMajor('other');
        setCustomMajor(majorVal);
      }

      const roomVal = editingModule.targetGradeLevel || 'ทุกห้อง';
      if (activeRooms.includes(roomVal)) {
        setTargetGradeLevel(roomVal);
        setCustomRoom('');
      } else {
        setTargetGradeLevel('other');
        setCustomRoom(roomVal);
      }
    } else {
      setTitle(`บทที่ ${existingModules.length + 1}: `);
      setDescription('');
      setIconName('🗄️');
      setDifficulty('beginner');
      setTargetMajor('ทุกสาขาวิชา');
      setCustomMajor('');
      setTargetGradeLevel('ทุกห้อง');
      setCustomRoom('');
    }
    setErrorMessage('');
  }, [editingModule, isOpen, existingModules.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('กรุณาระบุชื่อบทเรียน');
      return;
    }

    const finalMajor = targetMajor === 'other' ? (customMajor.trim() || 'ทุกสาขาวิชา') : targetMajor;
    const finalRoom = targetGradeLevel === 'other' ? (customRoom.trim() || 'ทุกห้อง') : targetGradeLevel;

    const updated: QuizModule = {
      id: editingModule?.id || `module-${Date.now()}`,
      title: cleanTitle,
      description: description.trim(),
      iconName: iconName.trim() || '🗄️',
      difficulty,
      targetMajor: finalMajor,
      targetGradeLevel: finalRoom,
      questions: editingModule?.questions || [],
    };

    sound.playCorrect();
    onSaveModule(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
              {iconName}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {isEditing ? 'แก้ไขข้อมูลบทเรียน' : 'สร้างบทเรียนใหม่ (New Module)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดชื่อ ระดับความยาก สาขาวิชา และห้องเรียนเป้าหมาย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Module Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อบทเรียน (Module Title) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น บทที่ 1: พื้นฐานคำสั่ง SELECT & FROM"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              คำอธิบายบทเรียน (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายสรุปเนื้อหาหลักหรือแนวคิดที่นักเรียนจะได้ฝึกฝนในบทนี้..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden resize-none"
            />
          </div>

          {/* Icon and Difficulty in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Icon Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ไอคอนประจำบทเรียน
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                {ICON_PRESETS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIconName(ic)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                      iconName === ic
                        ? 'bg-indigo-600 text-white shadow-xs scale-110'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ระดับความยาก (Difficulty)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'beginner', label: 'เริ่มต้น', color: 'emerald' },
                  { key: 'intermediate', label: 'ปานกลาง', color: 'blue' },
                  { key: 'advanced', label: 'ระดับสูง', color: 'purple' },
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDifficulty(d.key as DifficultyLevel)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      difficulty === d.key
                        ? d.key === 'beginner'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : d.key === 'intermediate'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target Major & Target Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Target Major */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>สาขาวิชาเป้าหมาย (Target Major)</span>
              </label>
              <select
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {activeMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="other">ระบุสาขาวิชาอื่น...</option>
              </select>

              {targetMajor === 'other' && (
                <input
                  type="text"
                  value={customMajor}
                  onChange={(e) => setCustomMajor(e.target.value)}
                  placeholder="พิมพ์ชื่อสาขาวิชา..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-100 text-xs outline-hidden"
                />
              )}
            </div>

            {/* Target Classroom / Room */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>ห้อง / ระดับชั้นเป้าหมาย (Target Room)</span>
              </label>
              <select
                value={targetGradeLevel}
                onChange={(e) => setTargetGradeLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {activeRooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="other">ระบุห้อง / ชั้นอื่น...</option>
              </select>

              {targetGradeLevel === 'other' && (
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="พิมพ์ชื่อห้อง เช่น ม.4/3, ปวช.2/3..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-100 text-xs outline-hidden"
                />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'สร้างบทเรียน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
