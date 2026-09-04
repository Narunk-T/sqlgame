import React, { useState, useRef, useEffect } from 'react';
import { Database, X, Table, Key, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { TableData } from '../types';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Record<string, TableData>;
  initialTable?: string;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
  tables,
  initialTable,
}) => {
  const tableNames = Object.keys(tables);
  const [selectedTable, setSelectedTable] = useState<string>(
    initialTable && tables[initialTable] ? initialTable : tableNames[0] || 'students'
  );
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [isWrapMode, setIsWrapMode] = useState<boolean>(false);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = 200;
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkScroll();
      if (tabsScrollRef.current && !isWrapMode) {
        const el = tabsScrollRef.current.querySelector(
          `[data-tab-name="${selectedTable}"]`
        ) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
  }, [isOpen, selectedTable, isWrapMode]);

  if (!isOpen) return null;

  const currentData = tables[selectedTable] || tables[tableNames[0]];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                สำรวจฐานข้อมูลจำลอง (Virtual Database Explorer)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ดูโครงสร้างตาราง คอลัมน์ และข้อมูลตัวอย่างเพื่อใช้อ้างอิงในการเขียนคำสั่ง SQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Selector Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>เลือกตาราง ({tableNames.length}):</span>
            </span>

            <div className="flex items-center gap-1">
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
                    title="เลื่อนซ้าย"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleScrollTabs('right')}
                    disabled={!canScrollRight}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      canScrollRight
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title="เลื่อนขวา"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsWrapMode(!isWrapMode)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title={isWrapMode ? 'โหมดแถวเดียว (Scroll)' : 'แสดงทั้งหมด (Wrap)'}
              >
                {isWrapMode ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={tabsScrollRef}
              onScroll={checkScroll}
              className={`pb-1 pt-0.5 ${
                isWrapMode
                  ? 'flex flex-wrap items-center gap-1.5'
                  : 'flex items-center gap-1.5 overflow-x-auto custom-scrollbar scroll-smooth'
              }`}
            >
              {tableNames.map((tName) => {
                const isSel = selectedTable === tName;
                return (
                  <button
                    key={tName}
                    data-tab-name={tName}
                    onClick={() => setSelectedTable(tName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer border ${
                      isSel
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span className="font-semibold">{tName}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-md ${
                        isSel ? 'bg-emerald-700/90 text-white font-bold' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tables[tName]?.rows?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentData ? (
            <>
              {/* Table Info & Schema */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold font-mono text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>ตาราง: {currentData.tableName}</span>
                    </h3>
                    {currentData.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentData.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {currentData.columns.length} คอลัมน์ | {currentData.rows.length} แถวข้อมูล
                  </span>
                </div>

                {/* Schema Badges */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
                    โครงสร้างคอลัมน์:
                  </span>
                  {currentData.columns.map((col) => (
                    <div
                      key={col.name}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono ${
                        col.isPrimary
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {col.isPrimary && <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                      <span className="font-semibold">{col.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">({col.type})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {currentData.columns.map((col) => (
                          <th key={col.name} className="px-4 py-2.5 font-semibold">
                            <div className="flex items-center gap-1">
                              {col.isPrimary && <Key className="w-3 h-3 text-amber-500" />}
                              <span>{col.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                      {currentData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {currentData.columns.map((col) => (
                            <td key={col.name} className="px-4 py-2 whitespace-nowrap">
                              {row[col.name] !== undefined && row[col.name] !== null ? (
                                String(row[col.name])
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 italic">NULL</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">ไม่พบข้อมูลตาราง</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
