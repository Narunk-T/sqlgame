import React, { useState, useEffect } from 'react';
import {
  Question,
  QuizModule,
  TableData,
  QuestionType,
  DifficultyLevel,
} from '../../types';
import { executeSimulatedSQL } from '../../utils/sqlEvaluator';
import {
  X,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileCode,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuestion: (question: Question, targetModuleId: string) => void;
  modules: QuizModule[];
  tables: Record<string, TableData>;
  editingQuestion?: Question | null;
  defaultModuleId?: string;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveQuestion,
  modules,
  tables,
  editingQuestion,
  defaultModuleId,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    editingQuestion?.moduleId || defaultModuleId || modules[0]?.id || 'module-1'
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<QuestionType>('drag_drop');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [basePoints, setBasePoints] = useState<number>(10);
  const [minPoints, setMinPoints] = useState<number>(0);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState<number>(1);
  const [targetTable, setTargetTable] = useState<string>('students');
  const [solutionSQL, setSolutionSQL] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');

  // Drag & Drop specific
  const [availableTokensInput, setAvailableTokensInput] = useState('');
  const [distractorTokensInput, setDistractorTokensInput] = useState('');

  // Fill in Blank specific
  const [blankTemplate, setBlankTemplate] = useState('');
  const [blankAnswersInput, setBlankAnswersInput] = useState(''); // e.g. b1: name, gpa | b2: students
  const [blankOptionsInput, setBlankOptionsInput] = useState(''); // e.g. b1: name, id, gpa | b2: students, courses

  // Test SQL output state
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (editingQuestion) {
      setSelectedModuleId(editingQuestion.moduleId);
      setTitle(editingQuestion.title);
      setDescription(editingQuestion.description);
      setType(editingQuestion.type);
      setDifficulty(editingQuestion.difficulty);
      setBasePoints(editingQuestion.basePoints);
      setMinPoints(editingQuestion.minPoints ?? 0);
      setPenaltyPerWrong(editingQuestion.penaltyPerWrong !== undefined ? editingQuestion.penaltyPerWrong : 1);
      setTargetTable(editingQuestion.targetTable);
      setSolutionSQL(editingQuestion.solutionSQL);
      setHint(editingQuestion.hint);
      setExplanation(editingQuestion.explanation);

      setAvailableTokensInput(editingQuestion.availableTokens?.join(', ') || '');
      setDistractorTokensInput(editingQuestion.distractorTokens?.join(', ') || '');

      setBlankTemplate(editingQuestion.blankTemplate || '');
      
      // Serialize blank answers
      if (editingQuestion.blankAnswers) {
        const str = Object.entries(editingQuestion.blankAnswers)
          .map(([k, arr]) => `${k}: ${(arr as string[]).join(', ')}`)
          .join('\n');
        setBlankAnswersInput(str);
      } else {
        setBlankAnswersInput('');
      }

      if (editingQuestion.blankOptions) {
        const str = Object.entries(editingQuestion.blankOptions)
          .map(([k, arr]) => `${k}: ${(arr as string[]).join(', ')}`)
          .join('\n');
        setBlankOptionsInput(str);
      } else {
        setBlankOptionsInput('');
      }
    } else {
      // Default new
      setSelectedModuleId(defaultModuleId || modules[0]?.id || 'module-1');
      setTitle('');
      setDescription('');
      setType('drag_drop');
      setDifficulty('beginner');
      setBasePoints(10);
      setMinPoints(0);
      setPenaltyPerWrong(1);
      setTargetTable(Object.keys(tables)[0] || 'students');
      setSolutionSQL('SELECT * FROM students;');
      setHint('ใช้คำสั่ง SELECT และ FROM');
      setExplanation('คำสั่ง SELECT ใช้ดึงข้อมูลจากตาราง');
      setAvailableTokensInput('SELECT, *, FROM, students;');
      setDistractorTokensInput('WHERE, ORDER BY, DELETE');
      setBlankTemplate('SELECT {{b1}} FROM {{b2}};');
      setBlankAnswersInput('b1: *\nb2: students');
      setBlankOptionsInput('b1: *, name, gpa\nb2: students, products');
    }
    setTestResult(null);
  }, [editingQuestion, isOpen]);

  if (!isOpen) return null;

  const handleTestSQL = () => {
    if (!solutionSQL.trim()) return;
    const res = executeSimulatedSQL(solutionSQL, tables);
    setTestResult(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !solutionSQL.trim()) return;

    // Parse tokens
    const availableTokens = availableTokensInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const distractorTokens = distractorTokensInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Parse blank answers
    const blankAnswers: Record<string, string[]> = {};
    blankAnswersInput.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const answers = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
        blankAnswers[key] = answers;
      }
    });

    // Parse blank options
    const blankOptions: Record<string, string[]> = {};
    blankOptionsInput.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const opts = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
        blankOptions[key] = opts;
      }
    });

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      moduleId: selectedModuleId,
      title: title.trim(),
      description: description.trim(),
      type,
      difficulty,
      basePoints: Number(basePoints) || 10,
      minPoints: Number(minPoints) >= 0 ? Number(minPoints) : 0,
      penaltyPerWrong: Number(penaltyPerWrong) >= 0 ? Number(penaltyPerWrong) : 1,
      targetTable,
      solutionSQL: solutionSQL.trim(),
      availableTokens: type === 'drag_drop' ? availableTokens : undefined,
      correctTokenOrder: type === 'drag_drop' ? availableTokens : undefined,
      distractorTokens: type === 'drag_drop' ? distractorTokens : undefined,
      blankTemplate: type === 'fill_blank' ? blankTemplate : undefined,
      blankAnswers: type === 'fill_blank' ? blankAnswers : undefined,
      blankOptions: type === 'fill_blank' ? blankOptions : undefined,
      hint: hint.trim(),
      explanation: explanation.trim(),
    };

    onSaveQuestion(questionData, selectedModuleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <span>{editingQuestion ? 'แก้ไขโจทย์ SQL' : 'สร้างโจทย์คำถาม SQL ข้อใหม่'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              กำหนดเนื้อหา ประเภทคำถาม คะแนนเต็ม การหักคะแนนเมื่อตอบผิด และเฉลยสำหรับให้นักเรียนเล่น
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Module & Basic Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ประจำบทเรียน (Module) *
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 font-medium"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ตารางฐานข้อมูลเป้าหมาย (Target Table) *
              </label>
              <select
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 font-mono font-medium"
              >
                {Object.keys(tables).map((t) => (
                  <option key={t} value={t}>
                    {t} ({tables[t].rows.length} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                หัวข้อโจทย์ / ภารกิจ (Title) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ค้นหานักเรียนที่มีเกรดเฉลี่ย GPA มากกว่า 3.50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                คำสั่งหรือคำอธิบายโจทย์ (Description) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="อธิบายสิ่งที่ต้องการให้นักเรียนเขียน เช่น จงเลือกแสดงเฉพาะชื่อ (name) และเกรด (gpa) จากตาราง students"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Type, Difficulty & Scoring Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>การตั้งค่ารูปแบบเกมและระบบคะแนน (Game & Scoring Policy)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  รูปแบบเกม (Question Type)
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                >
                  <option value="free_type">⚡ โหมดท้าทาย พิมพ์คำสั่ง SQL สด (Free-Text Challenge)</option>
                  <option value="drag_drop">🎮 ลากวางบล็อกคำสั่ง (Drag & Drop)</option>
                  <option value="fill_blank">✏️ เติมคำในช่องว่าง (Fill in the Blank)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ระดับความยาก (Difficulty)
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                >
                  <option value="beginner">ระดับเริ่มต้น (Beginner)</option>
                  <option value="intermediate">ระดับปานกลาง (Intermediate)</option>
                  <option value="advanced">ระดับสูง (Advanced)</option>
                </select>
              </div>
            </div>

            {/* Configurable Base Points & Penalty Score Controls */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Base Points */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  คะแนนเต็มข้อนี้ (Base Points) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={basePoints}
                    onChange={(e) => setBasePoints(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">แต้ม</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[5, 10, 15, 20].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBasePoints(pts)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                        basePoints === pts
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 text-slate-700'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penalty Per Wrong Answer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">
                    หักคะแนนเมื่อตอบผิด (Penalty) *
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={penaltyPerWrong}
                    onChange={(e) => setPenaltyPerWrong(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 rounded-xl focus:ring-2 focus:ring-rose-500 text-rose-700 dark:text-rose-300 font-mono font-bold"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">แต้ม/ครั้ง</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { val: 0, label: '0 (ไม่หัก)' },
                    { val: 1, label: '-1' },
                    { val: 2, label: '-2' },
                    { val: 3, label: '-3' },
                    { val: 5, label: '-5' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setPenaltyPerWrong(p.val)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                        penaltyPerWrong === p.val
                          ? 'bg-rose-600 text-white font-bold'
                          : 'bg-rose-100/70 hover:bg-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 text-rose-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Floor Points */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  คะแนนขั้นต่ำข้อนี้ (Floor Min Points)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={basePoints}
                    required
                    value={minPoints}
                    onChange={(e) => setMinPoints(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">แต้ม</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[0, 1, 2].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setMinPoints(pts)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                        minPoints === pts
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 text-slate-700'
                      }`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Explanation Example */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
              <div>
                💡 <strong>จำลองการคิดคะแนน:</strong> ตอบถูกรอบแรกได้ <strong>{basePoints}</strong> แต้ม | ตอบผิด 1 ครั้งได้ <strong>{Math.max(minPoints, basePoints - penaltyPerWrong)}</strong> แต้ม | ตอบผิด 2 ครั้งได้ <strong>{Math.max(minPoints, basePoints - (penaltyPerWrong * 2))}</strong> แต้ม (ไม่ต่ำกว่า {minPoints} แต้ม)
              </div>
            </div>
          </div>

          {/* Solution SQL Query */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                เฉลยคำสั่ง SQL ที่ถูกต้อง (Solution SQL) *
              </label>
              <button
                type="button"
                onClick={handleTestSQL}
                className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                <Play className="w-3 h-3 fill-indigo-600" />
                <span>ทดสอบรันคำสั่ง SQL</span>
              </button>
            </div>
            <textarea
              rows={2}
              required
              placeholder="เช่น SELECT name, gpa FROM students WHERE gpa >= 3.50;"
              value={solutionSQL}
              onChange={(e) => setSolutionSQL(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-900 text-sky-300 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />

            {/* Test result output */}
            {testResult && (
              <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                {testResult.success ? (
                  <div className="space-y-1 text-emerald-400">
                    <div className="flex items-center gap-1 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>คำสั่ง SQL ทำงานได้ถูกต้อง! (ผลลัพธ์: {testResult.rowCount} แถว)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      คอลัมน์ผลลัพธ์: {testResult.columns.join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ข้อผิดพลาด: {testResult.errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode Specific Configs */}
          {type === 'free_type' || type === 'free_text' ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>คุณสมบัติโหมดท้าทาย พิมพ์คำสั่ง SQL ด้วยตนเอง (Free-Text Challenge):</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                ในโหมดนี้ นักเรียนจะได้พิมพ์คำสั่ง SQL ด้วยตนเองทั้งหมดในตัวแก้ไขโค้ดพร้อมปุ่มคีย์เวิร์ดช่วยเหลือ ระบบจะนำคำสั่งที่นักเรียนพิมพ์ไปรันจำลองกับฐานข้อมูลจริงเพื่อตรวจความถูกต้องเทียบกับเฉลยที่คุณกำหนดด้านบน (ไม่จำเป็นต้องตั้งค่าบล็อกหรือช่องว่าง)
              </p>
            </div>
          ) : type === 'drag_drop' ? (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>ตั้งค่าบล็อกคำสั่งสำหรับโหมด Drag & Drop:</span>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
                  บล็อกคำสั่งที่ต้องใช้ (คั่นด้วยเครื่องหมายจุลภาค ,) *
                </label>
                <input
                  type="text"
                  placeholder="SELECT, name, gpa, FROM, students, WHERE, gpa >= 3.50;"
                  value={availableTokensInput}
                  onChange={(e) => setAvailableTokensInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
                  บล็อกหลอกเพื่อเพิ่มความท้าทาย (Distractor Tokens)
                </label>
                <input
                  type="text"
                  placeholder="ORDER BY, HAVING, DELETE, gpa < 3.0"
                  value={distractorTokensInput}
                  onChange={(e) => setDistractorTokensInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-slate-100"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>ตั้งค่าช่องว่างสำหรับโหมด Fill in the Blank:</span>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
                  เทมเพลตประโยค SQL (ใช้ {'{{b1}}'}, {'{{b2}}'} แทนช่องว่าง) *
                </label>
                <input
                  type="text"
                  placeholder="SELECT {{b1}} FROM students WHERE {{b2}} >= 3.50;"
                  value={blankTemplate}
                  onChange={(e) => setBlankTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
                    คำตอบที่ถูกต้อง (แต่ละบรรทัดคือ b1: คำตอบ1, คำตอบ2)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="b1: name, gpa&#10;b2: gpa"
                    value={blankAnswersInput}
                    onChange={(e) => setBlankAnswersInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
                    ตัวเลือกชิปคำแนะนำ (b1: ตัวเลือก1, ตัวเลือก2)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="b1: name, gpa, id, *&#10;b2: gpa, age, city"
                    value={blankOptionsInput}
                    onChange={(e) => setBlankOptionsInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hint and Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                คำใบ้ช่วยนักเรียน (Hint) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="เช่น ใช้คำสั่ง WHERE ตามด้วยชื่อคอลัมน์และเครื่องหมาย >="
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                คำอธิบายเฉลยเมื่อตอบถูก (Explanation) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="เช่น คำสั่ง WHERE gpa >= 3.50 จะทำการคัดกรองเฉพาะนักเรียนที่มีเกรด 3.5 ขึ้นไป"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all"
            >
              {editingQuestion ? 'บันทึกการแก้ไข' : 'สร้างโจทย์ข้อนี้'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
