import React, { useState, useRef, useEffect } from 'react';
import { Question, TableData } from '../../types';
import {
  Code,
  Trash2,
  Sparkles,
  Zap,
  CornerDownLeft,
  Copy,
  Check,
  Table as TableIcon,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface QuestionFreeTypeProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (sql: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  targetTableData?: TableData;
}

const COMMON_SQL_KEYWORDS = [
  'SELECT',
  '*',
  'FROM',
  'WHERE',
  '=',
  '>',
  '<',
  '>=',
  '<=',
  'AND',
  'OR',
  'LIKE',
  'ORDER BY',
  'DESC',
  'ASC',
  'LIMIT',
  'GROUP BY',
  'SUM()',
  'AVG()',
  'COUNT(*)',
  'INNER JOIN',
  'ON',
];

export const QuestionFreeType: React.FC<QuestionFreeTypeProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  onSubmit,
  disabled = false,
  targetTableData,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  // Insert snippet or keyword at current cursor position
  const insertText = (textToInsert: string) => {
    if (disabled) return;
    sound.playClick();
    const textarea = textareaRef.current;
    if (!textarea) {
      const newAnswer = currentAnswer ? `${currentAnswer} ${textToInsert}` : textToInsert;
      onAnswerChange(newAnswer);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentAnswer.substring(0, start);
    const after = currentAnswer.substring(end);

    // If adding a function like SUM() place cursor inside parenthesis
    let newCursorPos = start + textToInsert.length;
    if (textToInsert.endsWith('()')) {
      newCursorPos = start + textToInsert.length - 1;
    }

    // Add spacing if needed
    let insertion = textToInsert;
    if (before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') && !textToInsert.startsWith(' ')) {
      insertion = ` ${insertion}`;
      newCursorPos += 1;
    }

    const updated = before + insertion + after;
    onAnswerChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to run query
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit && !disabled && currentAnswer.trim()) {
        onSubmit();
      }
    }
  };

  const handleClear = () => {
    if (disabled) return;
    sound.playClick();
    onAnswerChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopy = () => {
    if (!currentAnswer) return;
    navigator.clipboard.writeText(currentAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Editor Container */}
      <div className="rounded-2xl border-2 border-indigo-300 dark:border-indigo-700/70 bg-slate-900 text-white shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono font-bold text-sky-400">
              <Code className="w-4 h-4 text-amber-400" />
              <span>SQL Query Editor (โหมดพิมพ์คำสั่งอิสระ)</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
              ⚡ Challenge Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentAnswer && (
              <button
                type="button"
                onClick={handleCopy}
                title="คัดลอกคำสั่ง SQL"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            )}

            {currentAnswer && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                title="ล้างข้อความทั้งหมด"
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>ล้างโค้ด</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea Code Input */}
        <div className="p-4 bg-slate-900">
          <textarea
            ref={textareaRef}
            rows={4}
            disabled={disabled}
            value={currentAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`-- พิมพ์คำสั่ง SQL ของคุณที่นี่ เช่น:\nSELECT * FROM ${question.targetTable || 'orders'};`}
            className="w-full bg-transparent font-mono text-sm sm:text-base text-emerald-400 placeholder:text-slate-600 focus:outline-hidden resize-none leading-relaxed selection:bg-indigo-600 selection:text-white"
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Editor Footer / Hint bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">กด <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Enter</kbd> เพื่อตรวจคำตอบและรัน SQL</span>
            <span className="sm:hidden">พิมพ์ SQL แล้วกดตรวจคำตอบ</span>
          </div>
          <div className="font-mono text-slate-500">
            {currentAnswer.length} ตัวอักษร
          </div>
        </div>
      </div>

      {/* Target Table Column Quick Inserters */}
      {targetTableData && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
            <span className="flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>คอลัมน์ในตาราง {targetTableData.tableName} (คลิกเพื่อแทรกในโค้ด):</span>
            </span>
            <button
              type="button"
              onClick={() => insertText(targetTableData.tableName)}
              disabled={disabled}
              className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
            >
              + {targetTableData.tableName}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {targetTableData.columns.map((col) => (
              <button
                key={col.name}
                type="button"
                onClick={() => insertText(col.name)}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/60 text-xs font-mono font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>{col.name}</span>
                <span className="text-[10px] opacity-60 ml-1">({col.type})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick SQL Keyword Chips */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>คลังคำสำคัญช่วยพิมพ์ (SQL Keyword Helpers):</span>
          </span>
          <span className="text-[11px] text-slate-400">คลิกเพื่อแทรกคำในจุดที่เคอร์เซอร์อยู่</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_SQL_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => insertText(kw)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
