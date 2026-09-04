import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { RefreshCw, Trash2, HelpCircle, GripHorizontal, ArrowDown } from 'lucide-react';
import { sound } from '../../utils/sound';

interface QuestionDragDropProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (sql: string) => void;
  disabled?: boolean;
}

export const QuestionDragDrop: React.FC<QuestionDragDropProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}) => {
  // Combine availableTokens and distractors, or default tokens
  const allTokens = [
    ...(question.availableTokens || []),
    ...(question.distractorTokens || []),
  ];

  // Store tokens placed in order
  const [placedTokens, setPlacedTokens] = useState<string[]>([]);
  // Store remaining tokens in pool (with unique IDs to handle duplicate tokens if any)
  const [poolTokens, setPoolTokens] = useState<{ id: string; text: string }[]>([]);

  // Initialize pool on question change
  useEffect(() => {
    const initialPool = allTokens
      .map((t, idx) => ({ id: `${t}-${idx}-${Math.random()}`, text: t }))
      .sort(() => Math.random() - 0.5); // Shuffle for game feel
    
    setPoolTokens(initialPool);
    setPlacedTokens([]);
  }, [question.id]);

  // Sync with currentAnswer changes
  const updateAnswer = (tokens: string[]) => {
    setPlacedTokens(tokens);
    const sql = tokens.join(' ');
    onAnswerChange(sql);
  };

  // Add token from pool to query line
  const handleSelectToken = (tokenObj: { id: string; text: string }) => {
    if (disabled) return;
    sound.playClick();
    const newPool = poolTokens.filter((t) => t.id !== tokenObj.id);
    const newPlaced = [...placedTokens, tokenObj.text];
    setPoolTokens(newPool);
    updateAnswer(newPlaced);
  };

  // Remove token from query line back to pool
  const handleRemovePlacedToken = (index: number) => {
    if (disabled) return;
    sound.playClick();
    const removedText = placedTokens[index];
    const newPlaced = placedTokens.filter((_, i) => i !== index);
    const newPool = [...poolTokens, { id: `${removedText}-${Date.now()}`, text: removedText }];
    setPoolTokens(newPool);
    updateAnswer(newPlaced);
  };

  // Move token in query line (Left/Right reordering)
  const handleMoveToken = (index: number, direction: 'left' | 'right') => {
    if (disabled) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= placedTokens.length) return;

    const newPlaced = [...placedTokens];
    const temp = newPlaced[index];
    newPlaced[index] = newPlaced[targetIdx];
    newPlaced[targetIdx] = temp;
    updateAnswer(newPlaced);
  };

  // Clear all
  const handleClear = () => {
    if (disabled) return;
    sound.playClick();
    const allInitial = allTokens.map((t, idx) => ({ id: `${t}-${idx}-${Date.now()}`, text: t }));
    setPoolTokens(allInitial.sort(() => Math.random() - 0.5));
    updateAnswer([]);
  };

  return (
    <div className="space-y-4">
      {/* Target Construction Area */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-950/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <GripHorizontal className="w-4 h-4" />
              <span>แถบลาก/จัดวางคำสั่ง SQL (Active Query Builder)</span>
            </span>
          </div>
          {placedTokens.length > 0 && !disabled && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างคำสั่ง</span>
            </button>
          )}
        </div>

        {/* Placed Tokens Line */}
        <div className="min-h-[72px] p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {placedTokens.length === 0 ? (
            <div className="w-full text-center py-3 text-xs text-slate-400 flex items-center justify-center gap-2">
              <ArrowDown className="w-4 h-4 text-blue-400 animate-bounce" />
              <span>คลิกหรือลากบล็อกคำสั่งจากด้านล่างเพื่อนำมาต่อเป็นประโยค SQL ที่สมบูรณ์</span>
            </div>
          ) : (
            placedTokens.map((tok, idx) => (
              <div
                key={idx}
                className="group relative flex items-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/60 dark:to-blue-950/80 border border-blue-300 dark:border-blue-600/60 text-blue-950 dark:text-blue-100 rounded-lg font-mono text-xs sm:text-sm font-semibold shadow-xs animate-in zoom-in-95 duration-150 overflow-hidden"
              >
                {/* Move Left Button */}
                {idx > 0 && !disabled && (
                  <button
                    onClick={() => handleMoveToken(idx, 'left')}
                    title="เลื่อนไปทางซ้าย"
                    className="px-1 py-2 text-slate-400 hover:text-blue-600 hover:bg-blue-200/50 dark:hover:bg-blue-800/50 text-[10px]"
                  >
                    ◀
                  </button>
                )}

                {/* Token Label & Click-to-remove */}
                <button
                  onClick={() => handleRemovePlacedToken(idx)}
                  disabled={disabled}
                  title="คลิกเพื่อนำออกจากประโยค"
                  className="px-2.5 py-1.5 hover:text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5"
                >
                  <span>{tok}</span>
                  <span className="text-[10px] opacity-40 group-hover:opacity-100 group-hover:text-rose-500 font-sans">
                    ✕
                  </span>
                </button>

                {/* Move Right Button */}
                {idx < placedTokens.length - 1 && !disabled && (
                  <button
                    onClick={() => handleMoveToken(idx, 'right')}
                    title="เลื่อนไปทางขวา"
                    className="px-1 py-2 text-slate-400 hover:text-blue-600 hover:bg-blue-200/50 dark:hover:bg-blue-800/50 text-[10px]"
                  >
                    ▶
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Live Formatted SQL Output */}
        {placedTokens.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-slate-900 text-sky-300 rounded-lg font-mono text-xs flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">โค้ดที่จะรัน:</span>
            <code className="text-emerald-400 font-bold">{placedTokens.join(' ')}</code>
          </div>
        )}
      </div>

      {/* Available Token Pool */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <span>คลังบล็อกคำสั่ง SQL (คลิกเพื่อเลือก):</span>
            <span className="text-[11px] text-slate-400 font-normal">
              (มีทั้งบล็อกที่ถูกต้อง และบล็อกหลอก {question.distractorTokens?.length || 0} ชิ้น)
            </span>
          </span>
          <button
            onClick={() => {
              setPoolTokens([...poolTokens].sort(() => Math.random() - 0.5));
            }}
            disabled={disabled || poolTokens.length === 0}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>สลับลำดับคลัง</span>
          </button>
        </div>

        {/* Pool Items */}
        <div className="flex flex-wrap gap-2.5 min-h-[50px] p-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
          {poolTokens.length === 0 ? (
            <div className="w-full text-center py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✨ นำบล็อกทั้งหมดมาประกอบคำสั่งเรียบร้อยแล้ว
            </div>
          ) : (
            poolTokens.map((tokenObj) => (
              <button
                key={tokenObj.id}
                onClick={() => handleSelectToken(tokenObj)}
                disabled={disabled}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>+ {tokenObj.text}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
