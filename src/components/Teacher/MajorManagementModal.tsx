import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../types';
import {
  X,
  BookOpen,
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
  Building2,
  GraduationCap,
  ArrowDownAZ,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { sortThaiAlphabetical } from '../../utils/storage';

interface MajorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  majors: string[];
  usersList: UserProfile[];
  onAddMajor: (major: string) => { success: boolean; message: string; majors: string[] };
  onUpdateMajor: (oldMajor: string, newMajor: string) => { success: boolean; message: string; majors: string[] };
  onDeleteMajor: (major: string) => { success: boolean; message: string; majors: string[] };
  onResetMajors: () => void;
}

const PRESET_MAJOR_GROUPS = [
  {
    name: 'คอมพิวเตอร์ & ดิจิทัล',
    majors: ['เทคโนโลยีสารสนเทศ', 'วิทยาการคอมพิวเตอร์', 'คอมพิวเตอร์ธุรกิจ', 'เทคโนโลยีธุรกิจดิจิทัล', 'วิศวกรรมซอฟต์แวร์'],
  },
  {
    name: 'บริหารธุรกิจ & การค้า',
    majors: ['การบัญชี', 'การตลาด', 'การจัดการโลจิสติกส์', 'การจัดการธุรกิจค้าปลีก'],
  },
  {
    name: 'ช่างอุตสาหกรรม & วิศวกรรม',
    majors: ['ช่างอิเล็กทรอนิกส์', 'ช่างไฟฟ้ากำลัง', 'ช่างยนต์', 'เมคคาทรอนิกส์และหุ่นยนต์'],
  },
  {
    name: 'สามัญศึกษา',
    majors: ['สามัญศึกษา (วิทย์-คณิต)', 'สามัญศึกษา (ศิลป์-คำนวณ)', 'สามัญศึกษา (ศิลป์-ภาษา)'],
  },
];

export const MajorManagementModal: React.FC<MajorManagementModalProps> = ({
  isOpen,
  onClose,
  majors,
  usersList,
  onAddMajor,
  onUpdateMajor,
  onDeleteMajor,
  onResetMajors,
}) => {
  const [newMajorInput, setNewMajorInput] = useState('');
  const [searchMajor, setSearchMajor] = useState('');
  const [editingMajor, setEditingMajor] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingConfirmMajor, setDeletingConfirmMajor] = useState<string | null>(null);

  // Map student counts per major
  const studentCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    usersList.forEach((u) => {
      if (u.role === 'student' && u.major) {
        counts[u.major] = (counts[u.major] || 0) + 1;
      }
    });
    return counts;
  }, [usersList]);

  const sortedAndFilteredMajors = useMemo(() => {
    const filtered = majors.filter((m) =>
      m.toLowerCase().includes(searchMajor.trim().toLowerCase())
    );
    return sortThaiAlphabetical(filtered);
  }, [majors, searchMajor]);

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const handleAddMajor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMajorInput.trim()) return;

    sound.playClick();
    const result = onAddMajor(newMajorInput.trim());
    if (result.success) {
      showNotification('success', result.message);
      setNewMajorInput('');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleStartEdit = (major: string) => {
    sound.playClick();
    setEditingMajor(major);
    setEditInput(major);
    setDeletingConfirmMajor(null);
  };

  const handleSaveEdit = (oldMajor: string) => {
    if (!editInput.trim()) return;
    sound.playClick();
    const result = onUpdateMajor(oldMajor, editInput.trim());
    if (result.success) {
      showNotification('success', result.message);
      setEditingMajor(null);
      setEditInput('');
    } else {
      showNotification('error', result.message);
    }
  };

  const handleDeleteMajor = (major: string) => {
    sound.playClick();
    const result = onDeleteMajor(major);
    if (result.success) {
      showNotification('success', result.message);
      setDeletingConfirmMajor(null);
      if (editingMajor === major) {
        setEditingMajor(null);
      }
    } else {
      showNotification('error', result.message);
    }
  };

  const handleApplyPreset = (presetMajors: string[]) => {
    sound.playClick();
    let addedCount = 0;
    presetMajors.forEach((m) => {
      if (!majors.includes(m)) {
        onAddMajor(m);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      showNotification('success', `เพิ่มสาขาวิชาจากชุดเทมเพลตจำนวน ${addedCount} สาขาเรียบร้อยแล้ว`);
    } else {
      showNotification('error', 'สาขาวิชาในชุดนี้มีอยู่ในระบบครบทั้งหมดแล้ว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>จัดการสาขาวิชา (Majors / Departments)</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {majors.length} สาขา
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดตัวเลือกสาขาวิชาสำหรับให้นักเรียนเลือกในขั้นตอนการสมัครสมาชิก เพื่อให้ข้อมูลถูกต้องตรงกัน
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

          {/* Add New Major Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>เพิ่มสาขาวิชาใหม่</span>
            </label>
            <form onSubmit={handleAddMajor} className="flex gap-2">
              <input
                type="text"
                value={newMajorInput}
                onChange={(e) => setNewMajorInput(e.target.value)}
                placeholder="เช่น เทคโนโลยีธุรกิจดิจิทัล, การจัดการโลจิสติกส์..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newMajorInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสาขา</span>
              </button>
            </form>

            {/* Quick Templates */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                เพิ่มด่วนตามกลุ่มสาขา:
              </span>
              {PRESET_MAJOR_GROUPS.map((group) => (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => handleApplyPreset(group.majors)}
                  className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  + {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search & List of Majors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสาขาวิชา..."
                  value={searchMajor}
                  onChange={(e) => setSearchMajor(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('คุณต้องการรีเซ็ตสาขาวิชาทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                    sound.playClick();
                    onResetMajors();
                    showNotification('success', 'รีเซ็ตสาขาวิชาเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
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
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/60 font-semibold">
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>จัดเรียงตามตัวอักษร: น้อยไปหามาก (ก - ฮ / A - Z)</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                แสดงผล {sortedAndFilteredMajors.length} สาขา
              </span>
            </div>

            {sortedAndFilteredMajors.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                ไม่พบสาขาวิชาที่ค้นหา
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedAndFilteredMajors.map((major) => {
                  const studentCount = studentCountMap[major] || 0;
                  const isEditingThis = editingMajor === major;
                  const isConfirmingDelete = deletingConfirmMajor === major;

                  return (
                    <div
                      key={major}
                      className={`p-3 rounded-xl border transition-all ${
                        isEditingThis
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                          : isConfirmingDelete
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {isEditingThis ? (
                        /* Edit Form */
                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                            แก้ไขชื่อสาขาวิชา:
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              autoFocus
                              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-hidden dark:text-slate-100 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(major)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>บันทึก</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setEditingMajor(null);
                              }}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            * การแก้ไขจะอัปเดตข้อมูลของนักเรียนและบทเรียนที่อยู่ในสาขานี้โดยอัตโนมัติ
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        /* Delete Confirmation Prompt */
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>ยืนยันการลบสาขา "{major}"?</span>
                          </div>
                          {studentCount > 0 && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400">
                              มีนักเรียนสังกัดสาขานี้อยู่ <strong>{studentCount} คน</strong>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteMajor(major)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              ลบสาขาวิชานี้
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setDeletingConfirmMajor(null);
                              }}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Major Badge Display */
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {major}
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
                              onClick={() => handleStartEdit(major)}
                              title="แก้ไขชื่อสาขาวิชา"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setDeletingConfirmMajor(major);
                                setEditingMajor(null);
                              }}
                              title="ลบสาขาวิชา"
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
            * ตัวเลือกสาขาวิชาทั้งหมดจะแสดงในหน้าสมัครเรียนของนักเรียนทันที
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
