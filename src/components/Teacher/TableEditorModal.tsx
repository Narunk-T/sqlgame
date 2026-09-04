import React, { useState, useEffect } from 'react';
import { TableData, TableColumn } from '../../types';
import { X, Plus, Trash2, Database, AlertCircle, Save, Key, Check } from 'lucide-react';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null; // null if creating new table
  existingTableNames: string[];
  onSaveTable: (newTableData: TableData, oldTableName?: string) => void;
}

const COMMON_DATA_TYPES = [
  'INT',
  'VARCHAR(50)',
  'VARCHAR(100)',
  'TEXT',
  'DECIMAL(10,2)',
  'DECIMAL(3,2)',
  'DATE',
  'BOOLEAN',
];

export const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  onClose,
  table,
  existingTableNames,
  onSaveTable,
}) => {
  const [tableName, setTableName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<TableColumn[]>([
    { name: 'id', type: 'INT', isPrimary: true },
    { name: 'name', type: 'VARCHAR(50)', isPrimary: false },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (table) {
      setTableName(table.tableName);
      setDescription(table.description || '');
      setColumns([...table.columns]);
    } else {
      setTableName('');
      setDescription('');
      setColumns([
        { name: 'id', type: 'INT', isPrimary: true },
        { name: 'title', type: 'VARCHAR(50)', isPrimary: false },
        { name: 'price', type: 'INT', isPrimary: false },
        { name: 'status', type: 'VARCHAR(20)', isPrimary: false },
      ]);
    }
    setError(null);
  }, [isOpen, table]);

  if (!isOpen) return null;

  const isEditMode = !!table;

  const handleAddColumn = () => {
    setColumns((prev) => [
      ...prev,
      { name: `col_${prev.length + 1}`, type: 'VARCHAR(50)', isPrimary: false },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) {
      setError('ตารางต้องมีอย่างน้อย 1 คอลัมน์');
      return;
    }
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: keyof TableColumn, value: any) => {
    setColumns((prev) => {
      const updated = [...prev];
      if (field === 'isPrimary' && value === true) {
        // Unset primary from others if single PK preferred, or allow multiple
        updated.forEach((c, idx) => {
          if (idx !== index) c.isPrimary = false;
        });
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTableName = tableName.trim().toLowerCase().replace(/\s+/g, '_');

    if (!cleanTableName) {
      setError('กรุณาระบุชื่อตาราง (Table Name)');
      return;
    }

    // Check valid identifier
    if (!/^[a-z][a-z0-9_]*$/.test(cleanTableName)) {
      setError('ชื่อตารางต้องขึ้นต้นด้วยตัวอักษรภาษาอังกฤษ และประกอบด้วย a-z, 0-9 หรือ _ เท่านั้น');
      return;
    }

    // Check duplicate table name if new or renamed
    if (
      (!isEditMode || table.tableName.toLowerCase() !== cleanTableName) &&
      existingTableNames.some((name) => name.toLowerCase() === cleanTableName)
    ) {
      setError(`ชื่อตาราง "${cleanTableName}" มีอยู่แล้วในระบบ กรุณาใช้ชื่ออื่น`);
      return;
    }

    // Validate column names
    const colNames = new Set<string>();
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const colName = col.name.trim().toLowerCase().replace(/\s+/g, '_');
      if (!colName) {
        setError(`กรุณาระบุชื่อสำหรับคอลัมน์ลำดับที่ ${i + 1}`);
        return;
      }
      if (!/^[a-z_][a-z0-9_]*$/.test(colName)) {
        setError(`ชื่อคอลัมน์ "${colName}" ไม่ถูกต้อง (ใช้ได้เฉพาะ a-z, 0-9, _)`);
        return;
      }
      if (colNames.has(colName)) {
        setError(`ชื่อคอลัมน์ "${colName}" ซ้ำกันในตาราง`);
        return;
      }
      colNames.add(colName);
    }

    // If editing existing table, keep existing rows but ensure keys match new columns
    let updatedRows: Record<string, any>[] = [];
    if (isEditMode && table.rows) {
      updatedRows = table.rows.map((row) => {
        const newRow: Record<string, any> = {};
        columns.forEach((col) => {
          const cName = col.name.trim().toLowerCase();
          newRow[cName] = row[cName] !== undefined ? row[cName] : '';
        });
        return newRow;
      });
    } else {
      // Create some initial mock sample rows for a newly created table
      updatedRows = [
        columns.reduce((acc, col, idx) => {
          const type = col.type.toUpperCase();
          if (col.isPrimary) acc[col.name] = 1;
          else if (type.includes('INT')) acc[col.name] = 100;
          else if (type.includes('DECIMAL')) acc[col.name] = 99.5;
          else if (type.includes('DATE')) acc[col.name] = '2025-01-15';
          else if (type.includes('BOOL')) acc[col.name] = true;
          else acc[col.name] = `ข้อมูลตัวอย่าง 1`;
          return acc;
        }, {} as Record<string, any>),
      ];
    }

    const newTableData: TableData = {
      tableName: cleanTableName,
      description: description.trim() || undefined,
      columns: columns.map((col) => ({
        ...col,
        name: col.name.trim().toLowerCase(),
      })),
      rows: updatedRows,
    };

    onSaveTable(newTableData, isEditMode ? table.tableName : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Database className="w-4 h-4" />
              </span>
              {isEditMode ? `แก้ไขโครงสร้างตาราง: ${table.tableName}` : 'สร้างตารางฐานข้อมูลใหม่ (Create Table)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กำหนดชื่อตาราง คำอธิบาย และโครงสร้างคอลัมน์สำหรับใช้ประมวลผลคำสั่ง SQL
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>ชื่อตาราง (Table Name) *</span>
                <span className="text-slate-400 text-[11px] font-normal">(ภาษาอังกฤษ ตัวพิมพ์เล็ก)</span>
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="เช่น books, customers, inventory"
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                คำอธิบายตาราง (Description)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น ตารางเก็บข้อมูลหนังสือและราคา"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Column Schema Definition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  โครงสร้างคอลัมน์ (Table Schema & Columns)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  กำหนดชื่อคอลัมน์ ชนิดข้อมูล และ Primary Key
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มคอลัมน์</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <div className="col-span-5">ชื่อคอลัมน์ (Column Name)</div>
                <div className="col-span-4">ชนิดข้อมูล (Data Type)</div>
                <div className="col-span-2 text-center">Primary Key</div>
                <div className="col-span-1 text-center">ลบ</div>
              </div>

              {columns.map((col, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
                      placeholder="เช่น id, name, price"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="col-span-4">
                    <input
                      list={`data-types-${idx}`}
                      type="text"
                      value={col.type}
                      onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
                      placeholder="INT, VARCHAR..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <datalist id={`data-types-${idx}`}>
                      {COMMON_DATA_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!col.isPrimary}
                        onChange={(e) => handleColumnChange(idx, 'isPrimary', e.target.checked)}
                        className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <Key className={`w-3.5 h-3.5 ${col.isPrimary ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </label>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(idx)}
                      disabled={columns.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">💡 ข้อมูลเพิ่มเติมเกี่ยวกับการใช้ตารางใหม่กับโจทย์:</p>
            <p className="text-[11px] leading-relaxed">
              เมื่อสร้างตารางใหม่เรียบร้อยแล้ว ตารางนี้จะไปปรากฏใน <strong>ตัวแก้ไขโจทย์ SQL (Question Editor)</strong> ของอาจารย์โดยอัตโนมัติ เพื่อให้อาจารย์สามารถตั้งโจทย์ SQL จากตารางใหม่ได้ทันที
            </p>
          </div>

          {/* Action Footer */}
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
              <span>{isEditMode ? 'บันทึกโครงสร้างตาราง' : 'สร้างตารางนี้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
