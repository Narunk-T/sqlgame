import React, { useState, useMemo, useCallback } from 'react';
import { GameSession, QuizModule, UserProfile } from '../../types';
import {
  Printer,
  Download,
  X,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Award,
  FileSpreadsheet,
  ExternalLink,
  FileText,
  Users,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { getPassingThreshold, savePassingThreshold } from '../../utils/storage';

interface ScoreReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: GameSession[];
  modules: QuizModule[];
  usersList: UserProfile[];
  selectedMajorFilter: string;
  selectedRoomFilter: string;
  selectedModuleFilter: string;
  currentUser?: UserProfile | null;
  passingThreshold?: number;
  onPassingThresholdChange?: (val: number) => void;
}

export interface StudentAggregatedRow {
  userId: string;
  studentId: string;
  name: string;
  nickname: string;
  major: string;
  gradeLevel: string;
  // Module scores mapped by moduleId: { score, maxScore, percent, isCompleted, lastSubmitted }
  moduleScores: Record<
    string,
    {
      score: number;
      maxScore: number;
      isCompleted: boolean;
      lastSubmitted?: string;
    }
  >;
  totalEarnedScore: number;
  totalMaxScore: number;
  overallPercentage: number;
  isOverallPassed: boolean;
  completedModulesCount: number;
  lastActiveDate: string;
}

export const ScoreReportModal: React.FC<ScoreReportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  modules,
  usersList,
  selectedMajorFilter,
  selectedRoomFilter,
  selectedModuleFilter,
  currentUser,
  passingThreshold: externalThreshold,
  onPassingThresholdChange: externalOnThresholdChange,
}) => {
  if (!isOpen) return null;

  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotification, setPrintNotification] = useState<string | null>(null);

  // Teacher configurable passing percentage threshold (Default 60%, saved in localStorage)
  const [internalThreshold, setInternalThreshold] = useState<number>(() => getPassingThreshold());
  const passingThreshold = externalThreshold !== undefined ? externalThreshold : internalThreshold;

  const handlePassingThresholdChange = (val: number) => {
    const valid = Math.min(100, Math.max(1, Number(val) || 60));
    setInternalThreshold(valid);
    savePassingThreshold(valid);
    if (externalOnThresholdChange) {
      externalOnThresholdChange(valid);
    }
  };

  // Active modules list to display in table columns
  const activeModules = useMemo(() => {
    if (selectedModuleFilter !== 'all') {
      const single = modules.find((m) => m.id === selectedModuleFilter);
      return single ? [single] : modules;
    }
    return modules;
  }, [modules, selectedModuleFilter]);

  const activeModuleName =
    selectedModuleFilter === 'all'
      ? 'ทุกชุดบทเรียน (All Modules)'
      : modules.find((m) => m.id === selectedModuleFilter)?.title || selectedModuleFilter;

  const activeMajorName =
    selectedMajorFilter === 'all' ? 'ทุกสาขาวิชา' : selectedMajorFilter;

  const activeRoomName =
    selectedRoomFilter === 'all' ? 'ทุกระดับชั้น / ทุกห้อง' : selectedRoomFilter;

  // Helper to reliably compute max points for a module from question basePoints
  const getModuleMaxScore = useCallback(
    (mod: QuizModule): number => {
      if (!mod) return 10;
      if (mod.questions && Array.isArray(mod.questions) && mod.questions.length > 0) {
        const sum = mod.questions.reduce((acc, q) => {
          const rawPts = q.basePoints !== undefined && q.basePoints !== null ? q.basePoints : (q as any).points;
          const pts = Number(rawPts);
          return acc + (isNaN(pts) || pts <= 0 ? 10 : pts);
        }, 0);
        if (sum > 0 && !isNaN(sum)) return sum;
      }
      // Fallback: check if any session has recorded maxPossibleScore for this module
      const sampleSession = sessions.find(
        (s) => s.moduleId === mod.id && s.maxPossibleScore && !isNaN(Number(s.maxPossibleScore)) && Number(s.maxPossibleScore) > 0
      );
      if (sampleSession && Number(sampleSession.maxPossibleScore) > 0) {
        return Number(sampleSession.maxPossibleScore);
      }
      // Fallback based on question count or 10
      const count = mod.questions && Array.isArray(mod.questions) ? mod.questions.length : 0;
      return count > 0 ? count * 10 : 10;
    },
    [sessions]
  );

  // Aggregate student score matrix: 1 Student = 1 Row
  const studentRows = useMemo<StudentAggregatedRow[]>(() => {
    // Collect all unique students from both usersList and sessions
    const studentMap = new Map<string, StudentAggregatedRow>();

    // 1. Initialize from usersList matching filters if any
    usersList.forEach((user) => {
      if (user.role === 'teacher') return; // Skip teacher accounts

      const majorMatch =
        selectedMajorFilter === 'all' || user.major === selectedMajorFilter;
      const roomMatch =
        selectedRoomFilter === 'all' || user.gradeLevel === selectedRoomFilter;

      if (majorMatch && roomMatch) {
        studentMap.set(user.id, {
          userId: user.id,
          studentId: user.studentId || '-',
          name: user.name,
          nickname: user.nickname || '-',
          major: user.major || 'วิทยาการคอมพิวเตอร์',
          gradeLevel: user.gradeLevel || '-',
          moduleScores: {},
          totalEarnedScore: 0,
          totalMaxScore: 0,
          overallPercentage: 0,
          isOverallPassed: false,
          completedModulesCount: 0,
          lastActiveDate: '',
        });
      }
    });

    // 2. Aggregate completed sessions
    sessions.forEach((sess) => {
      // Find or create student entry
      let student = studentMap.get(sess.userId);
      if (!student) {
        // Match by username if user was not in usersList map initially
        const existingByName = Array.from(studentMap.values()).find(
          (s) => s.name.trim().toLowerCase() === sess.userName.trim().toLowerCase()
        );
        if (existingByName) {
          student = existingByName;
        } else {
          const userMeta = usersList.find(
            (u) => u.id === sess.userId || u.name === sess.userName
          );
          const majorMatch =
            selectedMajorFilter === 'all' ||
            (userMeta?.major || 'วิทยาการคอมพิวเตอร์') === selectedMajorFilter;
          const roomMatch =
            selectedRoomFilter === 'all' || (userMeta?.gradeLevel || '-') === selectedRoomFilter;

          if (majorMatch && roomMatch) {
            student = {
              userId: sess.userId || `temp_${sess.userName}`,
              studentId: userMeta?.studentId || '-',
              name: sess.userName,
              nickname: userMeta?.nickname || '-',
              major: userMeta?.major || 'วิทยาการคอมพิวเตอร์',
              gradeLevel: userMeta?.gradeLevel || '-',
              moduleScores: {},
              totalEarnedScore: 0,
              totalMaxScore: 0,
              overallPercentage: 0,
              isOverallPassed: false,
              completedModulesCount: 0,
              lastActiveDate: '',
            };
            studentMap.set(student.userId, student);
          }
        }
      }

      if (!student) return;

      // Keep the best / highest score for this module if student played multiple times
      const currentScoreEntry = student.moduleScores[sess.moduleId];
      if (!currentScoreEntry || sess.totalScore >= currentScoreEntry.score) {
        student.moduleScores[sess.moduleId] = {
          score: sess.totalScore,
          maxScore: sess.maxPossibleScore,
          isCompleted: sess.isCompleted,
          lastSubmitted: sess.endTime || sess.startTime,
        };
      }

      // Update last active date
      const sessionDate = sess.endTime || sess.startTime;
      if (!student.lastActiveDate || sessionDate > student.lastActiveDate) {
        student.lastActiveDate = sessionDate;
      }
    });

    // 3. Compute totals and percentages for each student based on activeModules
    const rows = Array.from(studentMap.values()).map((row) => {
      let earned = 0;
      let maxScore = 0;
      let completedCount = 0;

      activeModules.forEach((m) => {
        const modResult = row.moduleScores[m.id];
        const defaultModMax = getModuleMaxScore(m);

        if (modResult) {
          const sScore = Number(modResult.score);
          earned += isNaN(sScore) ? 0 : sScore;
          const sMax = Number(modResult.maxScore);
          const validModMax = !isNaN(sMax) && sMax > 0 ? sMax : defaultModMax;
          maxScore += validModMax;
          if (modResult.isCompleted) completedCount++;
        } else {
          maxScore += defaultModMax;
        }
      });

      // คำนวณร้อยละของคะแนน: (คะแนนที่ทำได้ทั้งหมด / คะแนนเต็มทุกบท) * 100
      const overallPercent = maxScore > 0 ? Number(((earned / maxScore) * 100).toFixed(2)) : 0;
      const isPassed = overallPercent >= passingThreshold;

      return {
        ...row,
        totalEarnedScore: earned,
        totalMaxScore: maxScore,
        overallPercentage: overallPercent,
        isOverallPassed: isPassed,
        completedModulesCount: completedCount,
      };
    });

    // Sort by student ID or Name (Thai Alphabetical)
    return rows.sort((a, b) => {
      if (a.studentId !== '-' && b.studentId !== '-') {
        return a.studentId.localeCompare(b.studentId, 'th', { numeric: true });
      }
      return a.name.localeCompare(b.name, 'th');
    });
  }, [sessions, usersList, activeModules, selectedMajorFilter, selectedRoomFilter, getModuleMaxScore, passingThreshold]);

  // Calculate Statistics across all students
  const totalStudentsCount = studentRows.length;
  const activeStudentsWithSubmissions = studentRows.filter(
    (s) => s.completedModulesCount > 0 || s.totalEarnedScore > 0
  ).length;

  const totalAllEarned = studentRows.reduce((sum, s) => sum + s.totalEarnedScore, 0);
  const totalAllMax = studentRows.reduce((sum, s) => sum + s.totalMaxScore, 0);
  const classAvgPercent =
    totalAllMax > 0 ? ((totalAllEarned / totalAllMax) * 100).toFixed(2) : '0.00';
  const classAvgScore =
    totalStudentsCount > 0 ? (totalAllEarned / totalStudentsCount).toFixed(2) : '0.00';

  const passingStudentsCount = studentRows.filter((s) => s.isOverallPassed).length;
  const passRate =
    totalStudentsCount > 0
      ? ((passingStudentsCount / totalStudentsCount) * 100).toFixed(2)
      : '0.00';

  const maxTotalScore =
    studentRows.length > 0 ? Math.max(...studentRows.map((s) => s.totalEarnedScore)) : 0;
  const minTotalScore =
    studentRows.length > 0 ? Math.min(...studentRows.map((s) => s.totalEarnedScore)) : 0;

  const currentDateFormatted = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate self-contained, beautifully styled HTML document for printing
  const generatePrintableHtmlDocument = () => {
    // Generate Column Headers for Modules
    const moduleHeadersHtml = activeModules
      .map(
        (m, idx) => `
        <th style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 8.5pt; background-color: #f1f5f9; min-width: 65px;" title="${m.title}">
          <div>บทที่ ${idx + 1}</div>
          <div style="font-size: 7pt; color: #64748b; font-weight: normal;">(เต็ม ${getModuleMaxScore(m)})</div>
        </th>`
      )
      .join('');

    // Generate Rows for Each Student
    const rowsHtml =
      studentRows.length === 0
        ? `<tr><td colspan="${7 + activeModules.length + 3}" style="text-align:center; padding: 24px; color: #64748b;">ไม่พบข้อมูลนักเรียนหรือผลคะแนนที่ตรงกับเงื่อนไขการกรอง</td></tr>`
        : studentRows
            .map((student, idx) => {
              const moduleCellsHtml = activeModules
                .map((m, modIdx) => {
                  const modRes = student.moduleScores[m.id];
                  if (!modRes) {
                    return `<td style="padding: 5px 4px; border: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 9pt;">-</td>`;
                  }
                  const sModScore = Number(modRes.score);
                  const safeScore = isNaN(sModScore) ? 0 : sModScore;
                  const rawModMax = Number(modRes.maxScore);
                  const fallbackModMax = getModuleMaxScore(m);
                  const modMax = !isNaN(rawModMax) && rawModMax > 0 ? rawModMax : (fallbackModMax > 0 ? fallbackModMax : 10);
                  const modPercent = modMax > 0 ? (safeScore / modMax) * 100 : 0;
                  const safeModPercent = isNaN(modPercent) ? 0 : modPercent;
                  const isModPass = safeModPercent >= passingThreshold;
                  return `
                    <td style="padding: 5px 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 9pt; ${
                      isModPass ? 'color: #15803d; font-weight: bold;' : 'color: #b91c1c;'
                    }" title="บทที่ ${modIdx + 1}: ได้ ${safeScore}/${modMax} (${safeModPercent.toFixed(2)}%)">
                      ${safeScore}
                    </td>`;
                })
                .join('');

              const isPassed = student.isOverallPassed;
              const lastActive = student.lastActiveDate
                ? new Date(student.lastActiveDate).toLocaleDateString('th-TH', {
                    dateStyle: 'short',
                  })
                : '-';

              const safeEarned = isNaN(student.totalEarnedScore) ? 0 : student.totalEarnedScore;
              const safeMax = isNaN(student.totalMaxScore) || student.totalMaxScore <= 0 ? (activeModules.length * 10) : student.totalMaxScore;
              const safePercent = isNaN(student.overallPercentage) ? 0 : student.overallPercentage;

              return `
            <tr style="border-bottom: 1px solid #e2e8f0; ${
              idx % 2 === 1 ? 'background-color: #f8fafc;' : ''
            }">
              <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 9pt;">${
                idx + 1
              }</td>
              <td style="padding: 6px 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 9pt;">${
                student.studentId
              }</td>
              <td style="padding: 6px 6px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a; font-size: 9.5pt;">${
                student.name
              }</td>
              <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 9pt;">${
                student.nickname
              }</td>
              <td style="padding: 6px 6px; border: 1px solid #e2e8f0; color: #334155; font-size: 9pt;">${
                student.major
              }</td>
              <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; color: #334155; font-weight: 500; font-size: 9pt;">${
                student.gradeLevel
              }</td>
              ${moduleCellsHtml}
              <td style="padding: 6px 6px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: bold; color: #1e293b; font-size: 9.5pt; background-color: #f1f5f9;">
                ${safeEarned} / ${safeMax}
              </td>
              <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: bold; font-size: 9.5pt; ${
                isPassed ? 'color: #15803d;' : 'color: #b91c1c;'
              }">
                ${safePercent.toFixed(2)}%
              </td>
              <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9pt; font-weight: bold; ${
                  isPassed
                    ? 'background-color: #dcfce7; color: #166534; border: 1px solid #86efac;'
                    : 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'
                }">
                  ${isPassed ? 'ผ่านเกณฑ์' : 'ต้องปรับปรุง'}
                </span>
              </td>
            </tr>
          `;
            })
            .join('');

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานผลคะแนนและการประเมิน SQL - ${activeMajorName} - ${activeRoomName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', 'TH Sarabun New', 'Angsana New', sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 1.2cm 1cm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 15pt;
      font-weight: 700;
      margin: 0 0 3px 0;
      color: #0f172a;
    }
    .header h2 {
      font-size: 11pt;
      font-weight: 600;
      margin: 0 0 3px 0;
      color: #334155;
    }
    .header .date {
      font-size: 9.5pt;
      color: #64748b;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 8px 12px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }
    .meta-item label {
      display: block;
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
    }
    .meta-item value {
      display: block;
      font-weight: bold;
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 14px;
      font-size: 9pt;
    }
    .kpi-card {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      text-align: center;
    }
    .kpi-card .label {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-card .num {
      font-size: 12pt;
      font-weight: bold;
      font-family: monospace;
      color: #0f172a;
      margin-top: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 16px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
      padding: 6px 4px;
      border: 1px solid #cbd5e1;
      text-align: left;
      font-size: 8.5pt;
    }
    td {
      padding: 5px 6px;
      border: 1px solid #e2e8f0;
    }
    .signature-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-top: 20px;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    .sig-criteria {
      color: #475569;
      font-size: 8.5pt;
      line-height: 1.5;
      border: 1px dashed #cbd5e1;
      padding: 8px 10px;
      border-radius: 6px;
    }
    .sig-box {
      text-align: center;
      line-height: 1.8;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      @page {
        size: A4 landscape;
        margin: 1cm 0.8cm 1cm 0.8cm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>รายงานสรุปผลการประเมินและคะแนนการปฏิบัติการเขียนคำสั่ง SQL (รายบุคคลแยกตามบทเรียน)</h1>
    <h2>ระบบสื่อการเรียนรู้เชิงปฏิบัติการฐานข้อมูล (SQL Interactive Mastery Platform)</h2>
    <div class="date">ข้อมูล ณ วันที่ ${currentDateFormatted}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>สาขาวิชา:</label>
      <value>${activeMajorName}</value>
    </div>
    <div class="meta-item">
      <label>ระดับชั้น / ห้อง:</label>
      <value>${activeRoomName}</value>
    </div>
    <div class="meta-item">
      <label>ชุดบทเรียนที่ประเมิน:</label>
      <value>${activeModuleName}</value>
    </div>
    <div class="meta-item">
      <label>อาจารย์ผู้ประเมิน:</label>
      <value>${currentUser?.name || 'อาจารย์ผู้สอน'}</value>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="label">จำนวนนักเรียนทั้งหมด</div>
      <div class="num">${totalStudentsCount} คน <span style="font-size:8pt; font-weight:normal; color:#64748b;">(ส่งแล้ว ${activeStudentsWithSubmissions} คน)</span></div>
    </div>
    <div class="kpi-card">
      <div class="label">คะแนนรวมเฉลี่ยทั้งชั้น</div>
      <div class="num" style="color: #4338ca;">${classAvgScore} <span style="font-size:8pt; font-weight:normal; color:#64748b;">(${classAvgPercent}%)</span></div>
    </div>
    <div class="kpi-card">
      <div class="label">คะแนนรวม สูงสุด / ต่ำสุด</div>
      <div class="num">${maxTotalScore} / ${minTotalScore}</div>
    </div>
    <div class="kpi-card">
      <div class="label">อัตราการผ่านเกณฑ์รวม (≥${passingThreshold}%)</div>
      <div class="num" style="color: #15803d;">${passRate}% <span style="font-size:8pt; font-weight:normal; color:#64748b;">(${passingStudentsCount}/${totalStudentsCount})</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">ลำดับ</th>
        <th style="width: 75px;">รหัสนักเรียน</th>
        <th>ชื่อ - นามสกุล</th>
        <th style="text-align: center; width: 45px;">ชื่อเล่น</th>
        <th style="width: 100px;">สาขาวิชา</th>
        <th style="text-align: center; width: 50px;">ระดับชั้น</th>
        ${moduleHeadersHtml}
        <th style="text-align: center; width: 80px; background-color: #e2e8f0;">รวมทุกบท</th>
        <th style="text-align: center; width: 55px;">ร้อยละ (%)</th>
        <th style="text-align: center; width: 75px;">ผลประเมิน</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signature-section">
    <div class="sig-criteria">
      <div><strong>เกณฑ์การประเมินผลและการคิดคะแนนรวม:</strong></div>
      <div>• คะแนนรวม = ผลรวมของคะแนนที่ทำได้ทุกบทเรียนเปรียบเทียบกับคะแนนเต็มรวมทุกบท</div>
      <div>• ร้อยละของคะแนน (%) = (คะแนนที่ทำได้ทั้งหมด / คะแนนเต็มทุกบท) × 100 แสดงทศนิยม 2 ตำแหน่ง</div>
      <div>• <strong>เกณฑ์การตัดสิน (กำหนดโดยอาจารย์ผู้สอน):</strong> ผ่านเกณฑ์เมื่อได้คะแนนร้อยละ ${passingThreshold.toFixed(2)} ขึ้นไป | ต้องปรับปรุง: ได้คะแนนต่ำกว่าร้อยละ ${passingThreshold.toFixed(2)}</div>
    </div>
    <div class="sig-box">
      <div>ลงชื่อ ................................................................ อาจารย์ผู้ประเมิน</div>
      <div style="font-weight: 500;">( ${currentUser?.name || '................................................................'} )</div>
      <div style="color: #64748b; font-size: 8.5pt;">ตำแหน่ง ................................................................</div>
      <div style="color: #64748b; font-size: 8.5pt;">วันที่ ...... เดือน .......................... พ.ศ. ............</div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
  };

  // Print Action with multiple reliable fallbacks
  const handlePrint = () => {
    sound.playClick();
    setIsPrinting(true);
    setPrintNotification('กำลังเตรียมเอกสารสำหรับการพิมพ์แบบรายบุคคลแยกตามบทเรียน...');

    const htmlContent = generatePrintableHtmlDocument();

    try {
      let printFrame = document.getElementById(
        'sql-score-report-print-frame'
      ) as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'sql-score-report-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.opacity = '0.01';
        printFrame.style.border = '0';
        printFrame.style.pointerEvents = 'none';
        printFrame.style.zIndex = '-9999';
        document.body.appendChild(printFrame);
      }

      const frameDoc =
        printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            setIsPrinting(false);
            setPrintNotification(null);
          } catch (iframeErr) {
            console.warn('Iframe print failed, falling back to popup', iframeErr);
            fallbackPrint(htmlContent);
          }
        }, 400);
      } else {
        fallbackPrint(htmlContent);
      }
    } catch (err) {
      console.warn('Print initiation error, falling back:', err);
      fallbackPrint(htmlContent);
    }
  };

  // Fallback print strategy
  const fallbackPrint = (htmlContent: string) => {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWin = window.open(blobUrl, '_blank');

      if (printWin) {
        printWin.focus();
        setIsPrinting(false);
        setPrintNotification(null);
      } else {
        window.print();
        setIsPrinting(false);
        setPrintNotification(
          'โปรดอนุญาตป็อปอัปในเบราว์เซอร์ หรือคลิกปุ่ม "เปิดในแท็บใหม่" เพื่อพิมพ์'
        );
      }
    } catch (e) {
      window.print();
      setIsPrinting(false);
    }
  };

  // Open Standalone Print Document in New Tab
  const handleOpenPrintTab = () => {
    sound.playClick();
    const htmlContent = generatePrintableHtmlDocument();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  // Download Standalone HTML Document
  const handleDownloadHtml = () => {
    sound.playClick();
    const htmlContent = generatePrintableHtmlDocument();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedMajor =
      selectedMajorFilter === 'all'
        ? 'AllMajors'
        : selectedMajorFilter.replace(/\s+/g, '_');
    const sanitizedRoom =
      selectedRoomFilter === 'all'
        ? 'AllRooms'
        : selectedRoomFilter.replace(/[\s/]+/g, '_');
    link.setAttribute(
      'download',
      `SQL_Score_Matrix_${sanitizedMajor}_${sanitizedRoom}_${Date.now()}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV Action with Module Matrix Headers
  const handleExportCSV = () => {
    sound.playClick();
    const moduleHeaders = activeModules.map(
      (m, idx) => `"บทที่ ${idx + 1}: ${m.title} (เต็ม ${getModuleMaxScore(m)})"`
    );
    const headers = [
      'ลำดับ',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'สาขาวิชา',
      'ระดับชั้น/ห้อง',
      ...moduleHeaders,
      'คะแนนรวมทุกบท',
      'คะแนนเต็มรวม',
      'ร้อยละรวม (%)',
      `ผลการประเมิน (เกณฑ์ผ่าน ≥${passingThreshold}%)`,
    ];

    const rows = studentRows.map((s, idx) => {
      const moduleScores = activeModules.map((m) => {
        const modRes = s.moduleScores[m.id];
        const sc = modRes ? Number(modRes.score) : 0;
        return isNaN(sc) ? 0 : sc;
      });

      const status = s.isOverallPassed ? 'ผ่านเกณฑ์' : 'ต้องปรับปรุง';
      const safeEarned = isNaN(s.totalEarnedScore) ? 0 : s.totalEarnedScore;
      const safeMax = isNaN(s.totalMaxScore) || s.totalMaxScore <= 0 ? (activeModules.length * 10) : s.totalMaxScore;
      const safePercent = isNaN(s.overallPercentage) ? 0 : s.overallPercentage;

      return [
        idx + 1,
        `"${s.studentId}"`,
        `"${s.name}"`,
        `"${s.nickname}"`,
        `"${s.major}"`,
        `"${s.gradeLevel}"`,
        ...moduleScores,
        safeEarned,
        safeMax,
        safePercent.toFixed(2),
        `"${status}"`,
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedMajor =
      selectedMajorFilter === 'all'
        ? 'AllMajors'
        : selectedMajorFilter.replace(/\s+/g, '_');
    const sanitizedRoom =
      selectedRoomFilter === 'all'
        ? 'AllRooms'
        : selectedRoomFilter.replace(/[\s/]+/g, '_');
    link.setAttribute(
      'download',
      `SQL_Score_Matrix_${sanitizedMajor}_${sanitizedRoom}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Action Bar */}
        <div className="no-print p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                ตารางสรุปผลคะแนนรายบุคคลแยกตามบทเรียน (Student Score Matrix)
              </h2>
              <p className="text-[11px] text-slate-300">
                สาขาวิชา: <strong>{activeMajorName}</strong> • ระดับชั้น:{' '}
                <strong>{activeRoomName}</strong> • 1 นักเรียน = 1 แถวสรุป
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="ส่งออกรายงานเป็นไฟล์ Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintTab}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="เปิดหน้ารายงานในแท็บใหม่เพื่อพิมพ์หรือบันทึก PDF ทันที"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปิดแท็บใหม่</span>
              <span className="sm:hidden">แท็บใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์เอกสารรายงาน HTML เก็บไว้ในเครื่อง"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">บันทึก HTML</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
              title="สั่งพิมพ์ออกเครื่องพิมพ์ หรือบันทึกเป็น PDF (Landscape Mode)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'กำลังสั่งพิมพ์...' : 'สั่งพิมพ์ / บันทึก PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast if any */}
        {printNotification && (
          <div className="no-print bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>{printNotification}</span>
            <button
              onClick={() => setPrintNotification(null)}
              className="text-amber-800 dark:text-amber-200 underline font-bold cursor-pointer ml-3"
            >
              รับทราบ
            </button>
          </div>
        )}

        {/* Printable Document Container */}
        <div className="print-container flex-1 p-5 sm:p-8 overflow-y-auto bg-white text-slate-900 space-y-5">
          {/* Official Academic Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              รายงานสรุปผลการประเมินและคะแนนการปฏิบัติการเขียนคำสั่ง SQL (รายบุคคลแยกตามบทเรียน)
            </div>
            <div className="text-xs font-semibold text-slate-700">
              ระบบสื่อการเรียนรู้เชิงปฏิบัติการฐานข้อมูล (SQL Interactive Mastery Platform)
            </div>
            <div className="text-xs text-slate-500">ข้อมูล ณ วันที่ {currentDateFormatted}</div>
          </div>

          {/* Filtering Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>สาขาวิชา:</span>
              </span>
              <div className="font-bold text-slate-900">{activeMajorName}</div>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>ระดับชั้น / ห้อง:</span>
              </span>
              <div className="font-bold text-slate-900">{activeRoomName}</div>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>ชุดบทเรียนที่ประเมิน:</span>
              </span>
              <div className="font-bold text-slate-900 truncate" title={activeModuleName}>
                {activeModuleName} ({activeModules.length} บทเรียน)
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>อาจารย์ผู้ประเมิน:</span>
              </span>
              <div className="font-bold text-slate-900">
                {currentUser?.name || 'อาจารย์ผู้สอน'}
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-300 bg-white text-center">
              <div className="text-[11px] font-semibold text-slate-500">จำนวนนักเรียนในรุ่น</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5">
                {totalStudentsCount}{' '}
                <span className="text-xs font-normal font-sans text-slate-500">
                  (ส่งแล้ว {activeStudentsWithSubmissions} คน)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-300 bg-white text-center">
              <div className="text-[11px] font-semibold text-slate-500">คะแนนเฉลี่ยรวมทุกบท</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-indigo-700 mt-0.5">
                {classAvgScore}{' '}
                <span className="text-xs font-normal font-sans text-slate-500">
                  ({classAvgPercent}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-300 bg-white text-center">
              <div className="text-[11px] font-semibold text-slate-500">คะแนน สูงสุด / ต่ำสุด</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5">
                {maxTotalScore} <span className="text-xs text-slate-400">/</span> {minTotalScore}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-300 bg-white text-center">
              <div className="text-[11px] font-semibold text-slate-500">
                อัตราการผ่านเกณฑ์รวม (≥{passingThreshold}%)
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-0.5">
                {passRate}%{' '}
                <span className="text-xs font-normal font-sans text-slate-500">
                  ({passingStudentsCount}/{totalStudentsCount})
                </span>
              </div>
            </div>
          </div>

          {/* Matrix Score Table (1 Student = 1 Row) */}
          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            {studentRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ไม่พบรายชื่อนักเรียนหรือผลคะแนนที่ตรงกับเงื่อนไขการกรอง
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                    <th className="py-2 px-2.5 border-r border-slate-300 w-9 text-center">
                      ลำดับ
                    </th>
                    <th className="py-2 px-2.5 border-r border-slate-300 w-24">รหัสนักเรียน</th>
                    <th className="py-2 px-3 border-r border-slate-300 min-w-[130px]">
                      ชื่อ - นามสกุล
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 text-center w-14">
                      ชื่อเล่น
                    </th>
                    <th className="py-2 px-2.5 border-r border-slate-300 min-w-[110px]">
                      สาขาวิชา
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 text-center w-16">
                      ระดับชั้น
                    </th>
                    {activeModules.map((m, idx) => {
                      const maxPoints = getModuleMaxScore(m);
                      return (
                        <th
                          key={m.id}
                          className="py-2 px-2 border-r border-slate-300 text-center min-w-[65px] bg-slate-50"
                          title={m.title}
                        >
                          <div>บทที่ {idx + 1}</div>
                          <div className="text-[9px] font-normal text-slate-500">
                            (เต็ม {maxPoints})
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-2.5 border-r border-slate-300 text-center w-24 bg-indigo-50/70 text-indigo-950 font-bold">
                      รวมทุกบท
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 text-center w-16 font-bold">
                      ร้อยละ (%)
                    </th>
                    <th className="py-2 px-2.5 text-center w-24">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentRows.map((student, idx) => {
                    const isPassed = student.isOverallPassed;

                    return (
                      <tr key={student.userId} className="hover:bg-slate-50/80">
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-700">
                          {student.studentId}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                          {student.name}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-600">
                          {student.nickname}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                          {student.major}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-700 font-medium">
                          {student.gradeLevel}
                        </td>
                        {activeModules.map((m, modIdx) => {
                          const modRes = student.moduleScores[m.id];
                          if (!modRes) {
                            return (
                              <td
                                key={m.id}
                                className="py-2 px-2 border-r border-slate-200 text-center text-slate-300 font-mono"
                              >
                                -
                              </td>
                            );
                          }
                          const sModScore = Number(modRes.score);
                          const safeScore = isNaN(sModScore) ? 0 : sModScore;
                          const rawModMax = Number(modRes.maxScore);
                          const fallbackModMax = getModuleMaxScore(m);
                          const modMax = !isNaN(rawModMax) && rawModMax > 0 ? rawModMax : (fallbackModMax > 0 ? fallbackModMax : 10);
                          const modPercent = modMax > 0 ? (safeScore / modMax) * 100 : 0;
                          const safeModPercent = isNaN(modPercent) ? 0 : modPercent;
                          const isModPass = safeModPercent >= passingThreshold;
                          return (
                            <td
                              key={m.id}
                              className={`py-2 px-2 border-r border-slate-200 text-center font-mono font-bold ${
                                isModPass ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                              title={`บทที่ ${modIdx + 1}: ${m.title} (ได้ ${safeScore}/${modMax} หรือ ${safeModPercent.toFixed(2)}%)`}
                            >
                              {safeScore}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-900 bg-slate-50">
                          {isNaN(student.totalEarnedScore) ? 0 : student.totalEarnedScore} / {isNaN(student.totalMaxScore) || student.totalMaxScore <= 0 ? (activeModules.length * 10) : student.totalMaxScore}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                          {(isNaN(student.overallPercentage) ? 0 : student.overallPercentage).toFixed(2)}%
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {isPassed ? 'ผ่านเกณฑ์' : 'ต้องปรับปรุง'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Teacher Signature & Certification Area */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs break-inside-avoid">
            <div className="space-y-1 text-slate-500 text-[11px] p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="font-bold text-slate-700">เกณฑ์การคิดผลการประเมินภาพรวม:</div>
              <div>• <strong>คะแนนรวม:</strong> รวมคะแนนทุกบทเรียนที่นักเรียนทำได้ เทียบกับคะแนนเต็มรวมของทุกบท</div>
              <div>• <strong>ร้อยละการผ่าน (%):</strong> (คะแนนที่ทำได้ทุกบท / คะแนนเต็มทุกบท) × 100 แสดงทศนิยม 2 ตำแหน่ง</div>
              <div>• <strong>เกณฑ์การตัดสิน (อาจารย์กำหนด):</strong> ผ่านเกณฑ์เมื่อได้คะแนนรวมตั้งแต่ร้อยละ {passingThreshold.toFixed(2)} ขึ้นไป (ปัจจุบัน: {passingThreshold}%)</div>
            </div>

            <div className="text-center space-y-1.5 pt-2">
              <div className="text-slate-700">
                ลงชื่อ ................................................................ อาจารย์ผู้ประเมิน
              </div>
              <div className="text-slate-600 font-medium">
                ( {currentUser?.name || '................................................................'} )
              </div>
              <div className="text-slate-500 text-[11px]">
                ตำแหน่ง ................................................................
              </div>
              <div className="text-slate-500 text-[11px]">
                วันที่ ...... เดือน .......................... พ.ศ. ............
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
