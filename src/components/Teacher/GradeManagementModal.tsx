import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Users,
  Search,
  CheckCircle2,
  School,
  GraduationCap,
  ArrowDownAZ,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { sortThaiAlphabetical } from '../../utils/storage';

interface GradeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeLevels: string[];
  usersList: UserProfile[];
  onAddGradeLevel: (grade: string) => { success: boolean; message: string; grades: string[] };
  onUpdateGradeLevel: (oldGrade: string, newGrade: string) => { success: boolean; message: string; grades: string[] };
  onDeleteGradeLevel: (grade: string) => { success: boolean; message: string; grades: string[] };
  onResetGradeLevels: () => void;
}

const PRESET_GRADE_GROUPS = [
  {
    name: 'มัธยมต้น (ม.1 - ม.3)',
    grades: ['ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1', 'ม.3/2'],
  },
  {
    name: 'มัธยมปลาย (ม.4 - ม.6)',
    grades: ['ม.4/1', 'ม.4/2', 'ม.4/3', 'ม.5/1', 'ม.5/2', 'ม.6/1', 'ม.6/2'],
  },
  {
    name: 'อาชีวศึกษา (ปวช. 1-3)',
    grades: ['ปวช.1/1', 'ปวช.1/2', 'ปวช.2/1', 'ปวช.2/2', 'ปวช.3/1'],
  },
  {
    name: 'ระดับสูง (ปวส. 1-2)',
    grades: ['ปวส.1/1', 'ปวส.1/2', 'ปวส.2/1', 'ปวส.2/2'],
  },
];

export const GradeManagementModal: React.FC<GradeManagementModalProps> = ({
  isOpen,
  onClose,
  gradeLevels,
  usersList,
  onAddGradeLevel,
  onUpdateGradeLevel,
  onDeleteGradeLevel,
  onResetGradeLevels,
}) => {
  const [newGradeInput, setNewGradeInput] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingConfirmGrade, setDeletingConfirmGrade] = useState<string | null>(null);

  // Map student counts per grade
  const studentCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    usersList.forEach((u) => {
      if (u.role === 'student' && u.gradeLevel) {
        counts[u.gradeLevel] = (counts[u.gradeLevel] || 0) + 1;
      }
    });
    return counts;
  }, [usersList]);

  const sortedAndFilteredGrades = useMemo(() => {
    const filtered = gradeLevels.filter((g) =>
      g.toLowerCase().includes(searchGrade.trim().toLowerCase())
    );
    return sortThaiAlphabetical(filtered);
  }, [gradeLevels, searchGrade]);

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeInput.trim()) return;

    sound.playClick();
    const result = onAddGradeLevel(newGradeInput.trim());
    if (result.success) {
      showNotification('success', result.message);
      setNewGradeInput('');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleStartEdit = (grade: string) => {
    sound.playClick();
    setEditingGrade(grade);
    setEditInput(grade);
    setDeletingConfirmGrade(null);
  };

  const handleSaveEdit = (oldGrade: string) => {
    if (!editInput.trim()) return;
    sound.playClick();
    const result = onUpdateGradeLevel(oldGrade, editInput.trim());
    if (result.success) {
      showNotification('success', result.message);
      setEditingGrade(null);
      setEditInput('');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleDeleteGrade = (grade: string) => {
    sound.playClick();
    const result = onDeleteGradeLevel(grade);
    if (result.success) {
      showNotification('success', result.message);
      setDeletingConfirmGrade(null);
      if (editingGrade === grade) {
        setEditingGrade(null);
      }
    } else {
      showNotification('error', result.message);
    }
  };

  const handleApplyPreset = (presetGrades: string[]) => {
    sound.playClick();
    let addedCount = 0;
    presetGrades.forEach((g) => {
      if (!gradeLevels.includes(g)) {
        onAddGradeLevel(g);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      showNotification('success', `เพิ่มระดับชั้นจากชุดเทมเพลตจำนวน ${addedCount} ห้องเรียนเรียบร้อยแล้ว`);
    } else {
      showNotification('error', 'ระดับชั้นในชุดนี้มีอยู่ในระบบครบทั้งหมดแล้ว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>จัดการระดับชั้น / ห้องเรียน</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {gradeLevels.length} ห้อง
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดตัวเลือกระดับชั้นสำหรับให้นักเรียนเลือกในขั้นตอนการสมัครสมาชิกและสำหรับคัดกรองบทเรียน
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add New Grade Level Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>เพิ่มระดับชั้นใหม่</span>
            </label>
            <form onSubmit={handleAddGrade} className="flex gap-2">
              <input
                type="text"
                value={newGradeInput}
                onChange={(e) => setNewGradeInput(e.target.value)}
                placeholder="เช่น ม.4/3, ปวช.1/3, ปวส.1/1..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newGradeInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มห้องเรียน</span>
              </button>
            </form>

            {/* Quick Templates */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                เพิ่มด่วนตามหมวดหมู่:
              </span>
              {PRESET_GRADE_GROUPS.map((group) => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => handleApplyPreset(group.grades)}
                  className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  + {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search & List of Grade Levels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อระดับชั้น..."
                  value={searchGrade}
                  onChange={(e) => setSearchGrade(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการรีเซ็ตระดับชั้นทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                    sound.playClick();
                    onResetGradeLevels();
                    showNotification('success', 'รีเซ็ตระดับชั้นเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
                  }
                }}
                className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                title="รีเซ็ตเป็นค่าเริ่มต้น"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ตค่าเริ่มต้น</span>
              </button>
            </div>

            {/* Sort indicator banner */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60 font-semibold">
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>จัดเรียงตามตัวอักษร: น้อยไปหามาก (ก - ฮ / 0 - 9)</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                แสดงผล {sortedAndFilteredGrades.length} ห้อง
              </span>
            </div>

            {sortedAndFilteredGrades.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                ไม่พบระดับชั้นที่ค้นหา
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedAndFilteredGrades.map((grade) => {
                  const studentCount = studentCountMap[grade] || 0;
                  const isEditingThis = editingGrade === grade;
                  const isConfirmingDelete = deletingConfirmGrade === grade;

                  return (
                    <div
                      key={grade}
                      className={`p-3 rounded-xl border transition-all ${
                        isEditingThis
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                          : isConfirmingDelete
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {isEditingThis ? (
                        /* Edit Form */
                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                            แก้ไขชื่อระดับชั้น:
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              autoFocus
                              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg focus:outline-hidden dark:text-slate-100 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(grade)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>บันทึก</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setEditingGrade(null);
                              }}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            * การแก้ไขจะอัปเดตข้อมูลของนักเรียนและบทเรียนที่อยู่ในห้องนี้โดยอัตโนมัติ
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        /* Delete Confirmation Prompt */
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ยืนยันการลบ "{grade}"?</span>
                          </div>
                          {studentCount > 0 && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400">
                              มีนักเรียนสังกัดห้องนี้อยู่ <strong>{studentCount} คน</strong>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteGrade(grade)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              ลบห้องเรียนนี้
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setDeletingConfirmGrade(null);
                              }}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Grade Badge Display */
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <GraduationCap className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {grade}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{studentCount} คน</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(grade)}
                              title="แก้ไขชื่อระดับชั้น"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setDeletingConfirmGrade(grade);
                                setEditingGrade(null);
                              }}
                              title="ลบระดับชั้น"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            * ตัวเลือกทั้งหมดจะแสดงในหน้าสมัครเรียนของนักเรียนทันที
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
