import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Edit3, Sparkles, CheckCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

interface QuestionFillBlankProps {
  question: Question;
  currentAnswer: string;
  onAnswerChange: (sql: string) => void;
  disabled?: boolean;
}

export const QuestionFillBlank: React.FC<QuestionFillBlankProps> = ({
  question,
  onAnswerChange,
  disabled = false,
}) => {
  // Extract blanks like {{b1}}, {{b2}} from blankTemplate
  const template = question.blankTemplate || 'SELECT {{b1}} FROM {{b2}};';
  const blankKeys = Array.from(template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)).map((m) => m[1]);

  const [blankValues, setBlankValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset values on question change
    const initial: Record<string, string> = {};
    blankKeys.forEach((k) => {
      initial[k] = '';
    });
    setBlankValues(initial);
  }, [question.id]);

  const handleValueChange = (key: string, val: string) => {
    const updated = { ...blankValues, [key]: val };
    setBlankValues(updated);

    // Reconstruct SQL query
    let reconstructed = template;
    blankKeys.forEach((k) => {
      reconstructed = reconstructed.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), (updated[k] || '').trim());
    });
    onAnswerChange(reconstructed);
  };

  const handlePickOption = (key: string, val: string) => {
    if (disabled) return;
    sound.playClick();
    handleValueChange(key, val);
  };

  // Render template parts
  const templateParts = template.split(/(\{\{[a-zA-Z0-9_]+\}\})/g);

  return (
    <div className="space-y-4">
      {/* Template Box with Integrated Blanks */}
      <div className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            <span>เติมคำในช่องว่างเพื่อสร้างประโยค SQL (Fill in the Blanks)</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {blankKeys.length} ช่องที่ต้องเติม
          </span>
        </div>

        {/* Visual SQL Code with Inline Input Boxes */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-sm sm:text-base leading-loose flex flex-wrap items-center gap-2 border border-slate-800 shadow-inner">
          {templateParts.map((part, idx) => {
            const match = part.match(/^\{\{([a-zA-Z0-9_]+)\}\}$/);
            if (match) {
              const key = match[1];
              const val = blankValues[key] || '';
              const isFilled = val.trim().length > 0;

              return (
                <div key={idx} className="inline-flex items-center mx-1 my-1">
                  <div className="relative group">
                    <input
                      type="text"
                      disabled={disabled}
                      value={val}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      placeholder={`[ เติมช่องที่ ${key.replace(/^b/, '')} ]`}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-mono font-bold rounded-lg border-2 text-center transition-all min-w-[120px] focus:outline-hidden ${
                        isFilled
                          ? 'bg-indigo-950/90 text-amber-300 border-indigo-400 shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-dashed border-indigo-500/70 hover:border-indigo-400 focus:border-indigo-400 focus:bg-slate-800'
                      }`}
                    />
                    {isFilled && (
                      <span className="absolute -top-2 -right-1 text-emerald-400">
                        <CheckCircle className="w-4 h-4 fill-emerald-950" />
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <span key={idx} className="text-sky-300 font-semibold">
                {part}
              </span>
            );
          })}
        </div>
      </div>

      {/* Suggested Options Chips per Blank (For interactive assisted learning) */}
      <div className="space-y-3">
        {blankKeys.map((key) => {
          const options = question.blankOptions?.[key] || [];
          const currentVal = blankValues[key] || '';

          if (options.length === 0) return null;

          return (
            <div
              key={key}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ตัวเลือกสำหรับช่องที่ {key.replace(/^b/, '')}:</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {options.map((opt, optIdx) => {
                  const isSelected = currentVal.trim() === opt.trim();
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handlePickOption(key, opt)}
                      disabled={disabled}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
