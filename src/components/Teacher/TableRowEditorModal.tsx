import React, { useState, useEffect } from 'react';
import { TableData, TableColumn } from '../../types';
import { X, Save, AlertCircle, Plus } from 'lucide-react';

interface TableRowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData;
  editingRow: Record<string, any> | null;
  rowIndex: number | null;
  onSaveRow: (row: Record<string, any>, rowIndex: number | null) => void;
}

export const TableRowEditorModal: React.FC<TableRowEditorModalProps> = ({
  isOpen,
  onClose,
  table,
  editingRow,
  rowIndex,
  onSaveRow,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (editingRow) {
      setFormData({ ...editingRow });
    } else {
      // New row defaults based on column types
      const initial: Record<string, any> = {};
      table.columns.forEach((col) => {
        const type = col.type.toUpperCase();
        if (col.isPrimary) {
          // Auto-calculate next ID if INT
          if (type.includes('INT')) {
            const maxId = table.rows.reduce((max, r) => {
              const val = Number(r[col.name]);
              return !isNaN(val) && val > max ? val : max;
            }, 0);
            initial[col.name] = maxId + 1;
          } else {
            initial[col.name] = '';
          }
        } else if (type.includes('INT')) {
          initial[col.name] = 0;
        } else if (type.includes('DECIMAL') || type.includes('FLOAT') || type.includes('NUMERIC')) {
          initial[col.name] = 0.0;
        } else if (type.includes('BOOL')) {
          initial[col.name] = false;
        } else if (type.includes('DATE')) {
          initial[col.name] = new Date().toISOString().split('T')[0];
        } else {
          initial[col.name] = '';
        }
      });
      setFormData(initial);
    }
    setErrors({});
  }, [isOpen, editingRow, table]);

  if (!isOpen) return null;

  const handleChange = (colName: string, value: any, col: TableColumn) => {
    const type = col.type.toUpperCase();
    let processed = value;

    if (type.includes('INT')) {
      processed = value === '' ? '' : parseInt(value, 10);
      if (isNaN(processed) && value !== '') processed = value;
    } else if (type.includes('DECIMAL') || type.includes('FLOAT') || type.includes('NUMERIC')) {
      processed = value === '' ? '' : parseFloat(value);
      if (isNaN(processed) && value !== '') processed = value;
    } else if (type.includes('BOOL')) {
      processed = value === 'true' || value === true;
    }

    setFormData((prev) => ({
      ...prev,
      [colName]: processed,
    }));

    if (errors[colName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[colName];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate primary keys and required values
    table.columns.forEach((col) => {
      const val = formData[col.name];
      if (val === undefined || val === null || val === '') {
        newErrors[col.name] = `กรุณาระบุข้อมูลสำหรับ ${col.name}`;
      } else if (col.isPrimary && (!editingRow || editingRow[col.name] !== val)) {
        // Check for duplicate PK if new or changed
        const exists = table.rows.some((r, idx) => idx !== rowIndex && String(r[col.name]) === String(val));
        if (exists) {
          newErrors[col.name] = `ค่า Primary Key "${val}" มีอยู่แล้วในตาราง`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSaveRow(formData, rowIndex);
    onClose();
  };

  const isEditMode = rowIndex !== null && editingRow !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
              {isEditMode ? 'แก้ไขข้อมูลแถว (Edit Row)' : 'เพิ่มแถวข้อมูลใหม่ (Add New Row)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ตาราง <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{table.tableName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {table.columns.map((col) => {
            const typeUpper = col.type.toUpperCase();
            const isNumber = typeUpper.includes('INT') || typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT') || typeUpper.includes('NUMERIC');
            const isDate = typeUpper.includes('DATE');
            const isBool = typeUpper.includes('BOOL');

            return (
              <div key={col.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="font-mono">{col.name}</span>
                    {col.isPrimary && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                        PK
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {col.type}
                  </span>
                </div>

                {isBool ? (
                  <select
                    value={String(formData[col.name] ?? false)}
                    onChange={(e) => handleChange(col.name, e.target.value === 'true', col)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="true">TRUE (จริง)</option>
                    <option value="false">FALSE (เท็จ)</option>
                  </select>
                ) : isDate ? (
                  <input
                    type="date"
                    value={formData[col.name] || ''}
                    onChange={(e) => handleChange(col.name, e.target.value, col)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                ) : (
                  <input
                    type={isNumber ? 'number' : 'text'}
                    step={typeUpper.includes('DECIMAL') || typeUpper.includes('FLOAT') ? '0.01' : '1'}
                    value={formData[col.name] ?? ''}
                    onChange={(e) => handleChange(col.name, e.target.value, col)}
                    placeholder={`ระบุ ${col.name} (${col.type})`}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                )}

                {errors[col.name] && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors[col.name]}</span>
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'บันทึกการแก้ไขแถว' : 'เพิ่มข้อมูลแถวนี้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
