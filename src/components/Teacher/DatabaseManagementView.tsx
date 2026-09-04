import React, { useState, useRef, useEffect } from 'react';
import { TableData, TableColumn } from '../../types';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Search,
  Key,
  Layers,
  Table as TableIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { TableEditorModal } from './TableEditorModal';
import { TableRowEditorModal } from './TableRowEditorModal';
import { executeSimulatedSQL } from '../../utils/sqlEvaluator';

interface DatabaseManagementViewProps {
  tables: Record<string, TableData>;
  onSaveTable: (newTableData: TableData, oldTableName?: string) => void;
  onDeleteTable: (tableName: string) => void;
  onResetTables: () => void;
  onImportTables: (tables: Record<string, TableData>) => void;
  onOpenTableViewer?: (tableName: string) => void;
}

export const DatabaseManagementView: React.FC<DatabaseManagementViewProps> = ({
  tables,
  onSaveTable,
  onDeleteTable,
  onResetTables,
  onImportTables,
}) => {
  const tableKeys = Object.keys(tables);
  const [selectedTableName, setSelectedTableName] = useState<string>(tableKeys[0] || 'students');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTableEditorOpen, setIsTableEditorOpen] = useState(false);
  const [editingTableData, setEditingTableData] = useState<TableData | null>(null);

  const [isRowEditorOpen, setIsRowEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Table Tabs Scroll & Display State
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [isWrapMode, setIsWrapMode] = useState<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);
  const [tableFilterQuery, setTableFilterQuery] = useState<string>('');

  // Quick SQL Sandbox
  const [testSql, setTestSql] = useState(`SELECT * FROM ${selectedTableName};`);
  const [sqlResult, setSqlResult] = useState<any>(null);

  // Active table
  const currentTable: TableData | undefined = tables[selectedTableName] || tables[tableKeys[0]];

  // Check scroll bounds
  const checkScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = 260;
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tableKeys, isWrapMode, tableFilterQuery]);

  // Scroll active tab into view when selected
  useEffect(() => {
    if (tabsScrollRef.current && !isWrapMode) {
      const el = tabsScrollRef.current.querySelector(
        `[data-tab-name="${selectedTableName}"]`
      ) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    setTimeout(checkScroll, 150);
  }, [selectedTableName, isWrapMode]);

  // If active table is not set, sync to first available
  React.useEffect(() => {
    if (!tables[selectedTableName] && tableKeys.length > 0) {
      setSelectedTableName(tableKeys[0]);
    }
  }, [tables, selectedTableName, tableKeys]);

  // Update test SQL when switching table
  React.useEffect(() => {
    if (currentTable) {
      setTestSql(`SELECT * FROM ${currentTable.tableName};`);
      setSqlResult(null);
    }
  }, [selectedTableName]);

  // Filter rows
  const filteredRows = React.useMemo(() => {
    if (!currentTable) return [];
    if (!searchQuery.trim()) return currentTable.rows;

    const q = searchQuery.toLowerCase();
    return currentTable.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [currentTable, searchQuery]);

  // Create/Edit table handlers
  const handleOpenCreateTable = () => {
    setEditingTableData(null);
    setIsTableEditorOpen(true);
  };

  const handleOpenEditTable = () => {
    if (!currentTable) return;
    setEditingTableData(currentTable);
    setIsTableEditorOpen(true);
  };

  const handleDeleteCurrentTable = () => {
    if (!currentTable) return;
    if (tableKeys.length <= 1) {
      alert('ไม่สามารถลบตารางทั้งหมดได้ ต้องมีอย่างน้อย 1 ตารางในระบบ');
      return;
    }
    if (
      window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบตาราง "${currentTable.tableName}"? ข้อมูลทั้งหมดในตารางนี้จะหายไป`
      )
    ) {
      onDeleteTable(currentTable.tableName);
      const remaining = tableKeys.filter((k) => k !== currentTable.tableName);
      if (remaining.length > 0) {
        setSelectedTableName(remaining[0]);
      }
    }
  };

  // Row handlers
  const handleOpenAddRow = () => {
    setEditingRow(null);
    setEditingRowIndex(null);
    setIsRowEditorOpen(true);
  };

  const handleOpenEditRow = (row: Record<string, any>, index: number) => {
    setEditingRow(row);
    setEditingRowIndex(index);
    setIsRowEditorOpen(true);
  };

  const handleDeleteRow = (index: number) => {
    if (!currentTable) return;
    if (window.confirm(`ต้องการลบแถวข้อมูลลำดับที่ ${index + 1} ใช่หรือไม่?`)) {
      const updatedRows = currentTable.rows.filter((_, idx) => idx !== index);
      const updatedTable: TableData = {
        ...currentTable,
        rows: updatedRows,
      };
      onSaveTable(updatedTable, currentTable.tableName);
    }
  };

  const handleSaveRow = (row: Record<string, any>, index: number | null) => {
    if (!currentTable) return;
    let updatedRows = [...currentTable.rows];
    if (index !== null) {
      updatedRows[index] = row;
    } else {
      updatedRows.push(row);
    }
    const updatedTable: TableData = {
      ...currentTable,
      rows: updatedRows,
    };
    onSaveTable(updatedTable, currentTable.tableName);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tables, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `virtual_database_tables_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          onImportTables(parsed);
          alert('นำเข้าตารางฐานข้อมูลสำเร็จเรียบร้อย!');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Execute test SQL
  const handleRunTestSQL = () => {
    if (!testSql.trim()) return;
    const res = executeSimulatedSQL(testSql, tables);
    setSqlResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                จัดการฐานข้อมูลจำลอง (Virtual Database Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              ปรับแต่ง เพิ่ม หรือลบตารางและแถวข้อมูลใน Virtual Database เพื่อใช้ในการประมวลผลคำสั่ง SQL และสร้างโจทย์แบบฝึกหัด
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreateTable}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างตารางใหม่</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ส่งออกโครงสร้างและข้อมูลตารางเป็น JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก (Export)</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้า (Import)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'ต้องการรีเซ็ตตารางทั้งหมดกลับเป็นค่ามาตรฐาน (Default Tables) ใช่หรือไม่? ตารางที่สร้างขึ้นใหม่จะถูกลบ'
                  )
                ) {
                  onResetTables();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="รีเซ็ตตารางมาตรฐาน"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตมาตรฐาน</span>
            </button>
          </div>
        </div>

        {/* Table Selector Header & Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>ตารางทั้งหมดในฐานข้อมูล ({tableKeys.length})</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                (คลิกเพื่อเลือกดูและจัดการข้อมูลตาราง)
              </span>
            </div>

            {/* Quick Filter & Scroll / Wrap Toggle Controls */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {tableKeys.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อตาราง..."
                    value={tableFilterQuery}
                    onChange={(e) => setTableFilterQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 w-32 focus:w-44 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {tableFilterQuery && (
                    <button
                      onClick={() => setTableFilterQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Scroll buttons (Visible when in horizontal scroll mode) */}
              {!isWrapMode && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleScrollTabs('left')}
                    disabled={!canScrollLeft}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      canScrollLeft
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title="เลื่อนไปทางซ้าย"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleScrollTabs('right')}
                    disabled={!canScrollRight}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      canScrollRight
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title="เลื่อนไปทางขวา"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Toggle Layout (Wrap vs Scroll) */}
              <button
                onClick={() => setIsWrapMode(!isWrapMode)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isWrapMode ? 'เปลี่ยนเป็นแบบเลื่อนแนวนอน' : 'แสดงตารางทั้งหมด (Wrap)'}
              >
                {isWrapMode ? (
                  <>
                    <List className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">โหมดแถวเดียว (Scroll)</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">แสดงทั้งหมด (Wrap)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Selector Pills Container */}
          <div className="relative group">
            {/* Left fade gradient indicator when scrollable */}
            {!isWrapMode && canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            )}

            <div
              ref={tabsScrollRef}
              onScroll={checkScroll}
              className={`pt-1 pb-2.5 ${
                isWrapMode
                  ? 'flex flex-wrap items-center gap-2'
                  : 'flex items-center gap-2 overflow-x-auto custom-scrollbar scroll-smooth'
              }`}
            >
              {tableKeys
                .filter((k) =>
                  tableFilterQuery.trim()
                    ? k.toLowerCase().includes(tableFilterQuery.toLowerCase().trim())
                    : true
                )
                .map((tName) => {
                  const t = tables[tName];
                  const isSelected = selectedTableName === tName;
                  return (
                    <button
                      key={tName}
                      data-tab-name={tName}
                      onClick={() => setSelectedTableName(tName)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/30 dark:ring-indigo-400/30'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <TableIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                      <span className="font-bold">{tName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          isSelected
                            ? 'bg-indigo-700/90 text-white font-bold'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t?.rows?.length || 0} แถว
                      </span>
                    </button>
                  );
                })}

              {tableKeys.filter((k) =>
                tableFilterQuery.trim()
                  ? k.toLowerCase().includes(tableFilterQuery.toLowerCase().trim())
                  : true
              ).length === 0 && (
                <div className="text-xs text-slate-400 py-2 italic">
                  ไม่พบตารางที่ตรงกับคำค้นหา "{tableFilterQuery}"
                </div>
              )}
            </div>

            {/* Right fade gradient indicator when scrollable */}
            {!isWrapMode && canScrollRight && (
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {currentTable ? (
        <div className="space-y-6">
          {/* Table Header & Schema Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    ตาราง: {currentTable.tableName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {currentTable.rows.length} แถว | {currentTable.columns.length} คอลัมน์
                  </span>
                </div>
                {currentTable.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {currentTable.description}
                  </p>
                )}
              </div>

              {/* Table Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenAddRow}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มแถวข้อมูล (Add Row)</span>
                </button>

                <button
                  onClick={handleOpenEditTable}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="แก้ไขโครงสร้างคอลัมน์และชื่อตาราง"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>แก้ไขโครงสร้าง</span>
                </button>

                <button
                  onClick={handleDeleteCurrentTable}
                  disabled={tableKeys.length <= 1}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-30 cursor-pointer"
                  title="ลบตารางนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบตาราง</span>
                </button>
              </div>
            </div>

            {/* Column Schema Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">คอลัมน์:</span>
              {currentTable.columns.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300"
                >
                  <span className="font-bold">{col.name}</span>
                  <span className="text-[10px] text-slate-400">({col.type})</span>
                  {col.isPrimary && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-0.5">
                      <Key className="w-2.5 h-2.5" /> PK
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {/* Search & Counter Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`ค้นหาข้อมูลใน ${currentTable.tableName}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                แสดงผล {filteredRows.length} จาก {currentTable.rows.length} แถว
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/80">
                    <th className="py-2.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 w-12 text-center">
                      #
                    </th>
                    {currentTable.columns.map((col) => (
                      <th
                        key={col.name}
                        className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          {col.isPrimary && (
                            <Key className="w-3 h-3 text-amber-500" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 w-24 text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={currentTable.columns.length + 2}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        {searchQuery
                          ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"`
                          : 'ยังไม่มีข้อมูลในตารางนี้'}
                        <div className="mt-3">
                          <button
                            onClick={handleOpenAddRow}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                          >
                            + เพิ่มข้อมูลแถวแรก
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-center text-[11px]">
                          {idx + 1}
                        </td>
                        {currentTable.columns.map((col) => {
                          const val = row[col.name];
                          const isBool = typeof val === 'boolean';
                          return (
                            <td
                              key={col.name}
                              className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap"
                            >
                              {isBool ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    val
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {val ? 'TRUE' : 'FALSE'}
                                </span>
                              ) : val !== undefined && val !== null && val !== '' ? (
                                String(val)
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 italic font-sans text-[11px]">
                                  null
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditRow(row, idx)}
                              title="แก้ไขแถวนี้"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              title="ลบแถวนี้"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick SQL Sandbox */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ทดสอบรัน SQL กับตาราง (SQL Sandbox)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                จำลองผลลัพธ์คำสั่งแบบ Real-time
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={testSql}
                  onChange={(e) => setTestSql(e.target.value)}
                  placeholder="เช่น SELECT * FROM students WHERE gpa > 3.0;"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 text-emerald-400 border border-slate-700 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={handleRunTestSQL}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ทดสอบรัน SQL</span>
              </button>
            </div>

            {/* Sandbox Results */}
            {sqlResult && (
              <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {sqlResult.success ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ประมวลผลสำเร็จ ({sqlResult.rowCount} แถว)
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> เกิดข้อผิดพลาดในคำสั่ง
                      </span>
                    )}
                  </div>
                </div>

                {sqlResult.errorMessage ? (
                  <p className="text-xs text-rose-500 font-mono bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl">
                    {sqlResult.errorMessage}
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <tr>
                          {sqlResult.columns.map((c: string) => (
                            <th key={c} className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sqlResult.rows.map((r: any, idx: number) => (
                          <tr key={idx}>
                            {sqlResult.columns.map((c: string) => (
                              <td key={c} className="py-1.5 px-3 text-slate-800 dark:text-slate-200">
                                {String(r[c] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-slate-400 text-xs">ยังไม่มีตารางในระบบ</p>
          <button
            onClick={handleOpenCreateTable}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            + สร้างตารางแรกของคุณ
          </button>
        </div>
      )}

      {/* Table Structure Editor Modal */}
      <TableEditorModal
        isOpen={isTableEditorOpen}
        onClose={() => {
          setIsTableEditorOpen(false);
          setEditingTableData(null);
        }}
        table={editingTableData}
        existingTableNames={tableKeys}
        onSaveTable={onSaveTable}
      />

      {/* Row Data Editor Modal */}
      {currentTable && (
        <TableRowEditorModal
          isOpen={isRowEditorOpen}
          onClose={() => {
            setIsRowEditorOpen(false);
            setEditingRow(null);
            setEditingRowIndex(null);
          }}
          table={currentTable}
          editingRow={editingRow}
          rowIndex={editingRowIndex}
          onSaveRow={handleSaveRow}
        />
      )}
    </div>
  );
};
