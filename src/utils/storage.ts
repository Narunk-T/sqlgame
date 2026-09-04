import { INITIAL_MODULES, DEFAULT_USERS, SAMPLE_TABLES } from '../data/sampleData';
import {
  QuizModule,
  UserProfile,
  TableData,
  GameSession,
  StudentStats,
  ModuleProgress,
  StudentDetailedEvaluation,
} from '../types';

const STORAGE_KEYS = {
  MODULES: 'sql_quest_modules_v4',
  CURRENT_USER: 'sql_quest_current_user_v4',
  SESSIONS: 'sql_quest_sessions_v4',
  CUSTOM_TABLES: 'sql_quest_tables_v4',
  USERS_LIST: 'sql_quest_users_list_v4',
  GRADE_LEVELS: 'sql_quest_grade_levels_v4',
  MAJORS: 'sql_quest_majors_v4',
};

export const DEFAULT_GRADE_LEVELS: string[] = [
  'ปวช.1/1', 'ปวช.2/1', 'ปวช.3/1',
  'ปวส.1/1', 'ปวส.1/2', 'ปวส.2/1', 'ปวส.2/2',
  'ม.1/1', 'ม.1/2',
  'ม.2/1', 'ม.2/2',
  'ม.3/1', 'ม.3/2',
  'ม.4/1', 'ม.4/2', 'ม.4/3',
  'ม.5/1', 'ม.5/2',
  'ม.6/1', 'ม.6/2',
];

export const DEFAULT_MAJORS: string[] = [
  'การจัดการธุรกิจค้าปลีก',
  'การจัดการโลจิสติกส์',
  'การตลาด',
  'การบัญชี',
  'คอมพิวเตอร์ธุรกิจ',
  'ช่างยนต์',
  'ช่างอิเล็กทรอนิกส์',
  'ช่างไฟฟ้ากำลัง',
  'เทคโนโลยีธุรกิจดิจิทัล',
  'เทคโนโลยีสารสนเทศ',
  'วิทยาการคอมพิวเตอร์',
  'วิศวกรรมซอฟต์แวร์',
  'สามัญศึกษา',
];

// Helper to sort Thai/English string lists alphabetically and numerically (Ascending)
export function sortThaiAlphabetical(items: string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, 'th', { numeric: true, sensitivity: 'base' }));
}

// Grade Levels Management
export function getSavedGradeLevels(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADE_LEVELS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortThaiAlphabetical(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load grade levels from localStorage', e);
  }
  const defaultSorted = sortThaiAlphabetical(DEFAULT_GRADE_LEVELS);
  saveGradeLevels(defaultSorted);
  return defaultSorted;
}

export function saveGradeLevels(grades: string[]): void {
  try {
    // Keep unique, non-empty values
    const unique = Array.from(new Set(grades.map((g) => g.trim()).filter(Boolean)));
    const sorted = sortThaiAlphabetical(unique);
    localStorage.setItem(STORAGE_KEYS.GRADE_LEVELS, JSON.stringify(sorted));
  } catch (e) {
    console.error('Failed to save grade levels to localStorage', e);
  }
}

export function addGradeLevel(newGrade: string): { success: boolean; message: string; grades: string[] } {
  const trimmed = newGrade.trim();
  if (!trimmed) {
    return { success: false, message: 'กรุณากรอกชื่อระดับชั้น/ห้องเรียน', grades: getSavedGradeLevels() };
  }
  const currentGrades = getSavedGradeLevels();
  if (currentGrades.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
    return { success: false, message: `ระดับชั้น "${trimmed}" มีอยู่ในระบบแล้ว`, grades: currentGrades };
  }
  const updated = sortThaiAlphabetical([...currentGrades, trimmed]);
  saveGradeLevels(updated);
  return { success: true, message: `เพิ่มระดับชั้น "${trimmed}" สำเร็จแล้ว`, grades: updated };
}

export function updateGradeLevel(oldGrade: string, newGrade: string): { success: boolean; message: string; grades: string[] } {
  const trimmedOld = oldGrade.trim();
  const trimmedNew = newGrade.trim();
  if (!trimmedNew) {
    return { success: false, message: 'ชื่อระดับชั้นใหม่ต้องไม่ว่างเปล่า', grades: getSavedGradeLevels() };
  }
  const currentGrades = getSavedGradeLevels();
  if (trimmedOld.toLowerCase() !== trimmedNew.toLowerCase() && currentGrades.some((g) => g.toLowerCase() === trimmedNew.toLowerCase())) {
    return { success: false, message: `ระดับชั้น "${trimmedNew}" มีอยู่ในระบบแล้ว`, grades: currentGrades };
  }

  const updatedGrades = sortThaiAlphabetical(currentGrades.map((g) => (g === trimmedOld ? trimmedNew : g)));
  saveGradeLevels(updatedGrades);

  // Automatically update all users assigned to the old grade
  try {
    const users = getUsersList();
    let hasChanges = false;
    const updatedUsers = users.map((u) => {
      if (u.gradeLevel === trimmedOld) {
        hasChanges = true;
        return { ...u, gradeLevel: trimmedNew };
      }
      return u;
    });
    if (hasChanges) {
      saveUsersList(updatedUsers);
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.gradeLevel === trimmedOld) {
        setCurrentUser({ ...currentUser, gradeLevel: trimmedNew });
      }
    }
  } catch (e) {
    console.error('Failed to update users grade level cascade', e);
  }

  // Update modules targeting old grade
  try {
    const modules = getSavedModules();
    let hasModuleChanges = false;
    const updatedModules = modules.map((m) => {
      if (m.targetGradeLevel === trimmedOld) {
        hasModuleChanges = true;
        return { ...m, targetGradeLevel: trimmedNew };
      }
      return m;
    });
    if (hasModuleChanges) {
      saveModules(updatedModules);
    }
  } catch (e) {
    console.error('Failed to update modules grade level cascade', e);
  }

  return { success: true, message: `แก้ไขระดับชั้นเป็น "${trimmedNew}" สำเร็จแล้ว`, grades: updatedGrades };
}

export function deleteGradeLevel(gradeToDelete: string): { success: boolean; message: string; grades: string[] } {
  const trimmed = gradeToDelete.trim();
  const currentGrades = getSavedGradeLevels();
  const updated = sortThaiAlphabetical(currentGrades.filter((g) => g !== trimmed));
  saveGradeLevels(updated);
  return { success: true, message: `ลบระดับชั้น "${trimmed}" เรียบร้อยแล้ว`, grades: updated };
}

export function resetGradeLevelsToDefault(): string[] {
  const defaultSorted = sortThaiAlphabetical(DEFAULT_GRADE_LEVELS);
  saveGradeLevels(defaultSorted);
  return defaultSorted;
}

// Major / Department Management
export function getSavedMajors(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MAJORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortThaiAlphabetical(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load majors from localStorage', e);
  }
  const defaultSorted = sortThaiAlphabetical(DEFAULT_MAJORS);
  saveMajors(defaultSorted);
  return defaultSorted;
}

export function saveMajors(majors: string[]): void {
  try {
    const unique = Array.from(new Set(majors.map((m) => m.trim()).filter(Boolean)));
    const sorted = sortThaiAlphabetical(unique);
    localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(sorted));
  } catch (e) {
    console.error('Failed to save majors to localStorage', e);
  }
}

export function addMajor(newMajor: string): { success: boolean; message: string; majors: string[] } {
  const trimmed = newMajor.trim();
  if (!trimmed) {
    return { success: false, message: 'กรุณากรอกชื่อสาขาวิชา', majors: getSavedMajors() };
  }
  const currentMajors = getSavedMajors();
  if (currentMajors.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
    return { success: false, message: `สาขาวิชา "${trimmed}" มีอยู่ในระบบแล้ว`, majors: currentMajors };
  }
  const updated = sortThaiAlphabetical([...currentMajors, trimmed]);
  saveMajors(updated);
  return { success: true, message: `เพิ่มสาขาวิชา "${trimmed}" สำเร็จแล้ว`, majors: updated };
}

export function updateMajor(oldMajor: string, newMajor: string): { success: boolean; message: string; majors: string[] } {
  const trimmedOld = oldMajor.trim();
  const trimmedNew = newMajor.trim();
  if (!trimmedNew) {
    return { success: false, message: 'ชื่อสาขาวิชาใหม่ต้องไม่ว่างเปล่า', majors: getSavedMajors() };
  }
  const currentMajors = getSavedMajors();
  if (trimmedOld.toLowerCase() !== trimmedNew.toLowerCase() && currentMajors.some((m) => m.toLowerCase() === trimmedNew.toLowerCase())) {
    return { success: false, message: `สาขาวิชา "${trimmedNew}" มีอยู่ในระบบแล้ว`, majors: currentMajors };
  }

  const updatedMajors = sortThaiAlphabetical(currentMajors.map((m) => (m === trimmedOld ? trimmedNew : m)));
  saveMajors(updatedMajors);

  // Automatically cascade update all users assigned to the old major
  try {
    const users = getUsersList();
    let hasChanges = false;
    const updatedUsers = users.map((u) => {
      if (u.major === trimmedOld) {
        hasChanges = true;
        return { ...u, major: trimmedNew };
      }
      return u;
    });
    if (hasChanges) {
      saveUsersList(updatedUsers);
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.major === trimmedOld) {
        setCurrentUser({ ...currentUser, major: trimmedNew });
      }
    }
  } catch (e) {
    console.error('Failed to cascade update users major', e);
  }

  // Automatically cascade update modules targeting the old major
  try {
    const modules = getSavedModules();
    let hasModuleChanges = false;
    const updatedModules = modules.map((m) => {
      if (m.targetMajor === trimmedOld) {
        hasModuleChanges = true;
        return { ...m, targetMajor: trimmedNew };
      }
      return m;
    });
    if (hasModuleChanges) {
      saveModules(updatedModules);
    }
  } catch (e) {
    console.error('Failed to cascade update modules major', e);
  }

  return { success: true, message: `แก้ไขสาขาวิชาเป็น "${trimmedNew}" สำเร็จแล้ว`, majors: updatedMajors };
}

export function deleteMajor(majorToDelete: string): { success: boolean; message: string; majors: string[] } {
  const trimmed = majorToDelete.trim();
  const currentMajors = getSavedMajors();
  const updated = sortThaiAlphabetical(currentMajors.filter((m) => m !== trimmed));
  saveMajors(updated);
  return { success: true, message: `ลบสาขาวิชา "${trimmed}" เรียบร้อยแล้ว`, majors: updated };
}

export function resetMajorsToDefault(): string[] {
  const defSorted = sortThaiAlphabetical(DEFAULT_MAJORS);
  saveMajors(defSorted);
  return defSorted;
}

// Initialize or get modules
export function getSavedModules(): QuizModule[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MODULES);
    if (saved) {
      const parsed: QuizModule[] = JSON.parse(saved);
      // Ensure all standard initial modules are merged if missing and have targetMajor/targetGradeLevel
      const initialMap = new Map(INITIAL_MODULES.map((m) => [m.id, m]));
      const enriched = parsed.map((m) => {
        const init = initialMap.get(m.id);
        return {
          ...m,
          targetMajor: m.targetMajor || init?.targetMajor || 'ทุกสาขาวิชา',
          targetGradeLevel: m.targetGradeLevel || init?.targetGradeLevel || 'ทุกห้อง',
        };
      });

      const existingIds = new Set(enriched.map((m) => m.id));
      const missing = INITIAL_MODULES.filter((m) => !existingIds.has(m.id));
      if (missing.length > 0) {
        const merged = [...enriched, ...missing];
        saveModules(merged);
        return merged;
      }
      return enriched;
    }
  } catch (e) {
    console.error('Failed to load modules from localStorage', e);
  }
  return INITIAL_MODULES;
}

export function saveModules(modules: QuizModule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
  } catch (e) {
    console.error('Failed to save modules to localStorage', e);
  }
}

export function resetModulesToDefault(): QuizModule[] {
  saveModules(INITIAL_MODULES);
  return INITIAL_MODULES;
}

// Current User
export function getCurrentUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved === 'null') {
      return null;
    }
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load current user', e);
  }
  return DEFAULT_USERS[0]; // Default to teacher on very first visit
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user === null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'null');
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save current user', e);
  }
}

export function clearCurrentUser(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'null');
  } catch (e) {
    console.error('Failed to clear current user', e);
  }
}

// Users List
export function getUsersList(): UserProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (saved) {
      const parsed: UserProfile[] = JSON.parse(saved);
      // Ensure default users exist if list is empty or missing teachers
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load users list', e);
  }
  saveUsersList(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveUsersList(users: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users list', e);
  }
}

// Update single user
export function updateUser(updatedUser: UserProfile): UserProfile[] {
  const users = getUsersList();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  let updatedList: UserProfile[];
  if (index >= 0) {
    updatedList = [...users];
    updatedList[index] = updatedUser;
  } else {
    updatedList = [...users, updatedUser];
  }
  saveUsersList(updatedList);

  // If current logged-in user is updated, update current user too
  const current = getCurrentUser();
  if (current && current.id === updatedUser.id) {
    setCurrentUser(updatedUser);
  }

  return updatedList;
}

// Register student (default status = 'pending')
export function registerStudent(studentData: {
  studentId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gradeLevel: string;
  major?: string;
  username: string;
  password?: string;
  email?: string;
  avatar?: string;
}): { success: boolean; message: string; user?: UserProfile } {
  const users = getUsersList();

  // Check username uniqueness
  const cleanUsername = studentData.username.trim().toLowerCase();
  const existingUsername = users.find(
    (u) => (u.username || '').toLowerCase() === cleanUsername
  );
  if (existingUsername) {
    return { success: false, message: `ชื่อผู้ใช้ (username) "${studentData.username}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่อผู้ใช้อื่น` };
  }

  // Check 11-digit Student ID uniqueness
  const cleanStudentId = studentData.studentId.trim();
  const existingStudentId = users.find((u) => u.studentId === cleanStudentId);
  if (existingStudentId) {
    return { success: false, message: `รหัสประจำตัวนักเรียน "${cleanStudentId}" มีผู้ลงทะเบียนในระบบแล้ว` };
  }

  const fullName = `${studentData.firstName.trim()} ${studentData.lastName.trim()}`;
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  const newUser: UserProfile = {
    id: `student-${Date.now()}`,
    role: 'student',
    username: cleanUsername,
    password: studentData.password || '123456',
    name: fullName,
    firstName: studentData.firstName.trim(),
    lastName: studentData.lastName.trim(),
    nickname: studentData.nickname.trim(),
    studentId: cleanStudentId,
    gradeLevel: studentData.gradeLevel.trim(),
    major: studentData.major?.trim() || 'วิทยาการคอมพิวเตอร์',
    email: (studentData.email || '').trim(),
    avatar: studentData.avatar || ['👦', '👧', '🧑‍💻', '👩‍💻', '🎓', '🚀'][Math.floor(Math.random() * 6)],
    status: 'pending', // ต้องให้อาจารย์เป็นผู้อนุญาต
    createdAt: dateStr,
  };

  const updatedUsers = [...users, newUser];
  saveUsersList(updatedUsers);

  return {
    success: true,
    message: 'ลงทะเบียนสำเร็จเรียบร้อย! กรุณารออาจารย์ผู้สอนอนุมัติการใช้งานก่อนเข้าสู่ระบบ',
    user: newUser,
  };
}

// Approve student
export function approveStudent(studentId: string, teacherName: string = 'อาจารย์ผู้สอน'): UserProfile[] {
  const users = getUsersList();
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  const updatedList = users.map((u) => {
    if (u.id === studentId) {
      return {
        ...u,
        status: 'approved' as const,
        approvedAt: dateStr,
        approvedBy: teacherName,
      };
    }
    return u;
  });

  saveUsersList(updatedList);
  return updatedList;
}

// Reject or Suspend student
export function rejectStudent(studentId: string): UserProfile[] {
  const users = getUsersList();
  const updatedList = users.map((u) => {
    if (u.id === studentId) {
      return {
        ...u,
        status: 'rejected' as const,
      };
    }
    return u;
  });

  saveUsersList(updatedList);
  return updatedList;
}

// Delete student
export function deleteUser(userId: string): UserProfile[] {
  const users = getUsersList();
  const updatedList = users.filter((u) => u.id !== userId);
  saveUsersList(updatedList);

  // Also clean up game sessions for this user
  try {
    const sessions = getGameSessions();
    const updatedSessions = sessions.filter((s) => s.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
  } catch (e) {
    console.error('Failed to clean sessions', e);
  }

  return updatedList;
}

// Delete all students (Clears student records and scores for a new semester)
export function deleteAllStudents(): UserProfile[] {
  const users = getUsersList();
  // Keep only teachers and non-student accounts
  const updatedList = users.filter((u) => u.role !== 'student');
  saveUsersList(updatedList);

  // Clear all game sessions and attempts
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear game sessions', e);
  }

  return updatedList;
}

// Database Tables
export function getDatabaseTables(): Record<string, TableData> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TABLES);
    if (saved) {
      const parsed: Record<string, TableData> = JSON.parse(saved);
      // Ensure newly added tables like orders and order_details are included
      let hasMissing = false;
      Object.keys(SAMPLE_TABLES).forEach((k) => {
        if (!parsed[k]) {
          parsed[k] = SAMPLE_TABLES[k];
          hasMissing = true;
        }
      });
      if (hasMissing) {
        saveDatabaseTables(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load database tables', e);
  }
  return SAMPLE_TABLES;
}

export function saveDatabaseTables(tables: Record<string, TableData>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TABLES, JSON.stringify(tables));
  } catch (e) {
    console.error('Failed to save database tables', e);
  }
}

export function resetDatabaseTablesToDefault(): Record<string, TableData> {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TABLES, JSON.stringify(SAMPLE_TABLES));
  } catch (e) {
    console.error('Failed to reset database tables', e);
  }
  return SAMPLE_TABLES;
}

export function deleteDatabaseTable(tableName: string): Record<string, TableData> {
  const current = getDatabaseTables();
  const updated = { ...current };
  delete updated[tableName];
  saveDatabaseTables(updated);
  return updated;
}

// Game Sessions and History
export function getGameSessions(): GameSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load game sessions', e);
  }
  return [];
}

export function saveGameSession(session: GameSession): void {
  try {
    const all = getGameSessions();
    const existingIndex = all.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      all[existingIndex] = session;
    } else {
      all.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save game session', e);
  }
}

// Calculate Leaderboard & Student Stats
export function calculateLeaderboard(): StudentStats[] {
  const sessions = getGameSessions().filter((s) => s.isCompleted);
  const users = getUsersList().filter((u) => u.role === 'student');

  interface InternalStat extends StudentStats {
    totalCorrect: number;
  }

  const statsMap: Record<string, InternalStat> = {};

  // Initialize with known students (default accuracy to 0 if not played yet)
  users.forEach((u) => {
    statsMap[u.id] = {
      userId: u.id,
      userName: u.name,
      totalScore: 0,
      quizzesCompleted: 0,
      accuracyRate: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      lastPlayedAt: '-',
    };
  });

  sessions.forEach((s) => {
    if (!statsMap[s.userId]) {
      statsMap[s.userId] = {
        userId: s.userId,
        userName: s.userName,
        totalScore: 0,
        quizzesCompleted: 0,
        accuracyRate: 0,
        totalAttempts: 0,
        totalCorrect: 0,
        lastPlayedAt: '-',
      };
    }

    const stat = statsMap[s.userId];
    stat.totalScore += s.totalScore;
    stat.quizzesCompleted += 1;

    Object.values(s.questionAttempts).forEach((att) => {
      stat.totalAttempts += att.attemptsCount;
      if (att.isCorrect) stat.totalCorrect += 1;
    });

    if (stat.totalAttempts > 0) {
      stat.accuracyRate = Math.round((stat.totalCorrect / stat.totalAttempts) * 100);
    }
    if (s.endTime) {
      stat.lastPlayedAt = new Date(s.endTime).toLocaleDateString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  });

  return Object.values(statsMap).sort((a, b) => b.totalScore - a.totalScore);
}

// Calculate Comprehensive Student Progress & Self-Evaluation Report
export function calculateStudentEvaluation(
  userId: string,
  modules: QuizModule[],
  sessions: GameSession[]
): StudentDetailedEvaluation {
  const user = getUsersList().find((u) => u.id === userId) || getCurrentUser();
  const userName = user?.name || 'นักเรียน';

  const userSessions = sessions.filter((s) => s.userId === userId);
  let totalMistakeDeductions = 0;
  let totalAttemptsCount = 0;
  let totalCorrectCount = 0;

  userSessions.forEach((s) => {
    Object.values(s.questionAttempts || {}).forEach((att) => {
      totalAttemptsCount += att.attemptsCount || 0;
      totalMistakeDeductions += att.deductedPoints || 0;
      if (att.isCorrect) totalCorrectCount += 1;
    });
  });

  const accuracyRate =
    totalAttemptsCount > 0 ? Math.round((totalCorrectCount / totalAttemptsCount) * 100) : 0;

  let totalScoreEarned = 0;
  let totalPossibleScore = 0;
  let completedModulesCount = 0;
  let masteredModulesCount = 0;

  const moduleProgressList: ModuleProgress[] = modules.map((mod, index) => {
    const modSessions = userSessions.filter((s) => s.moduleId === mod.id);
    const completedSessions = modSessions.filter((s) => s.isCompleted);
    const maxPoints = mod.questions.reduce((sum, q) => sum + q.basePoints, 0);
    totalPossibleScore += maxPoints;

    let bestScore = 0;
    if (completedSessions.length > 0) {
      bestScore = Math.max(0, ...completedSessions.map((s) => s.totalScore));
    }
    totalScoreEarned += bestScore;

    const latestSession = [...modSessions].sort(
      (a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0)
    )[0];
    const latestScore = latestSession ? Math.max(0, latestSession.totalScore) : 0;

    const percentage = maxPoints > 0 ? Math.round((bestScore / maxPoints) * 100) : 0;
    const scoreBoostPotential = Math.max(0, maxPoints - bestScore);

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'N/A' = 'N/A';
    if (completedSessions.length > 0) {
      if (percentage >= 95) grade = 'S';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 65) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else grade = 'D';
    }

    let status: 'not_started' | 'in_progress' | 'passed' | 'mastered' = 'not_started';
    if (completedSessions.length > 0) {
      if (percentage >= 100) {
        status = 'mastered';
        masteredModulesCount += 1;
        completedModulesCount += 1;
      } else {
        status = 'passed';
        completedModulesCount += 1;
      }
    } else if (modSessions.length > 0) {
      status = 'in_progress';
    }

    let lastAttemptAt: string | undefined = undefined;
    if (latestSession?.endTime || latestSession?.startTime) {
      const timeMs = latestSession.endTime || latestSession.startTime;
      lastAttemptAt = new Date(timeMs).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Smart Recommendation per Module
    let recommendation: ModuleProgress['recommendation'];
    if (status === 'not_started') {
      recommendation = {
        type: 'start',
        text: 'ยังไม่เคยทำบทนี้ คลิกเพื่อเริ่มทดสอบเก็บคะแนนสะสม',
        actionLabel: 'เริ่มทำแบบทดสอบ',
        actionColor: 'blue',
      };
    } else if (status === 'mastered') {
      recommendation = {
        type: 'mastered',
        text: '🌟 ยอดเยี่ยมระดับ Master! คุณได้คะแนนเต็ม 100% แล้วในบทนี้',
        actionLabel: 'ทบทวนอีกครั้ง',
        actionColor: 'purple',
      };
    } else if (percentage >= 80) {
      recommendation = {
        type: 'next',
        text: `เกรด ${grade} (${bestScore}/${maxPoints} แต้ม) ผ่านเกณฑ์ระดับสูง แนะนำลุยต่อบทถัดไป หรือสอบซ้ำเพื่อเก็บคะแนนเพิ่มอีก +${scoreBoostPotential} แต้ม`,
        actionLabel: `ทดสอบซ้ำ (+${scoreBoostPotential} แต้ม)`,
        actionColor: 'emerald',
      };
    } else {
      recommendation = {
        type: 'boost',
        text: `⚡ แนะนำทดสอบซ้ำ! คุณสามารถเก็บคะแนนเพิ่มได้อีก +${scoreBoostPotential} แต้ม เพื่ออัปเกรดเป็นระดับ Master`,
        actionLabel: `ทดสอบซ้ำเพิ่มคะแนน (+${scoreBoostPotential} แต้ม)`,
        actionColor: 'amber',
      };
    }

    return {
      moduleId: mod.id,
      moduleTitle: mod.title,
      difficulty: mod.difficulty,
      totalQuestions: mod.questions.length,
      maxPoints,
      bestScore,
      latestScore,
      percentage,
      grade,
      attemptsCount: modSessions.length,
      completedAttemptsCount: completedSessions.length,
      status,
      lastAttemptAt,
      scoreBoostPotential,
      recommendation,
    };
  });

  const totalModulesCount = modules.length;
  const completionRate =
    totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;
  const overallPercentage =
    totalPossibleScore > 0 ? Math.round((totalScoreEarned / totalPossibleScore) * 100) : 0;

  let overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'N/A' = 'N/A';
  if (completedModulesCount > 0) {
    if (overallPercentage >= 90) overallGrade = 'S';
    else if (overallPercentage >= 75) overallGrade = 'A';
    else if (overallPercentage >= 60) overallGrade = 'B';
    else if (overallPercentage >= 45) overallGrade = 'C';
    else overallGrade = 'D';
  }

  let masteryTitle = '🌱 ผู้เริ่มต้นผจญภัย (SQL Novice)';
  if (overallPercentage >= 95 && completedModulesCount === totalModulesCount) {
    masteryTitle = '👑 ปรมาจารย์แห่ง SQL (SQL Grandmaster)';
  } else if (overallPercentage >= 80) {
    masteryTitle = '⚔️ ผู้เชี่ยวชาญคำสั่ง SQL (SQL Master)';
  } else if (overallPercentage >= 65) {
    masteryTitle = '🛡️ นักพัฒนา SQL ก้าวหน้า (SQL Specialist)';
  } else if (overallPercentage >= 40 || completedModulesCount > 0) {
    masteryTitle = '🏹 ผู้ฝึกฝน SQL (SQL Apprentice)';
  }

  const bestScorePotentialGain = Math.max(0, totalPossibleScore - totalScoreEarned);

  // Determine the Single Best Action Recommendation for the Student
  let recommendedNextAction: StudentDetailedEvaluation['recommendedNextAction'];

  // 1. Check if there are modules with low score / high boost potential (< 80%)
  const boostableModules = moduleProgressList
    .filter((m) => m.completedAttemptsCount > 0 && m.percentage < 80)
    .sort((a, b) => b.scoreBoostPotential - a.scoreBoostPotential);

  // 2. Check if there is an unstarted module in logical sequence
  const nextUnstartedModule = moduleProgressList.find((m) => m.status === 'not_started');

  // 3. Check if all completed and all 100%
  const allMastered = totalModulesCount > 0 && masteredModulesCount === totalModulesCount;

  if (allMastered) {
    recommendedNextAction = {
      title: '🎉 ยินดีด้วย! คุณพิชิตคะแนนเต็มครบทุกบทเรียน 100%!',
      description: 'คุณมีความรู้ความเข้าใจในคำสั่ง SQL ครบถ้วนทุกมิติ พร้อมสำหรับการสอบจริงและการทำงานจริง!',
      actionType: 'all_mastered',
      actionLabel: 'ทบทวนความรู้ทั้งหมด',
    };
  } else if (boostableModules.length > 0 && (!nextUnstartedModule || boostableModules[0].scoreBoostPotential >= 5)) {
    const target = boostableModules[0];
    recommendedNextAction = {
      title: `⚡ แนะนำเร่งด่วน: กลับไปทดสอบซ้ำใน '${target.moduleTitle}'`,
      description: `ปัจจุบันได้ ${target.bestScore}/${target.maxPoints} คะแนน (เกรด ${target.grade}) หากทดสอบซ้ำอีกครั้ง คุณจะสามารถสะสมคะแนนเพิ่มได้สูงสุดอีก +${target.scoreBoostPotential} แต้ม เพื่ออัปเกรดเกรดและอันดับในห้องเรียน`,
      targetModuleId: target.moduleId,
      targetModuleTitle: target.moduleTitle,
      actionType: 'boost',
      actionLabel: `ทดสอบซ้ำเพื่อเก็บ +${target.scoreBoostPotential} แต้ม`,
      potentialPoints: target.scoreBoostPotential,
    };
  } else if (nextUnstartedModule) {
    recommendedNextAction = {
      title: `🚀 ก้าวสู่บทถัดไป: '${nextUnstartedModule.moduleTitle}'`,
      description: `คุณพร้อมที่จะเรียนรู้คำสั่งใหม่แล้ว ลุยต่อเพื่อสะสมคะแนนเพิ่มอีก +${nextUnstartedModule.maxPoints} แต้ม และเพิ่มอัตราความสำเร็จของหลักสูตร`,
      targetModuleId: nextUnstartedModule.moduleId,
      targetModuleTitle: nextUnstartedModule.moduleTitle,
      actionType: 'next',
      actionLabel: `เริ่มทำแบบทดสอบบทนี้ (+${nextUnstartedModule.maxPoints} แต้ม)`,
      potentialPoints: nextUnstartedModule.maxPoints,
    };
  } else {
    // Some modules are completed with >=80% but not 100%
    const improvableModule = moduleProgressList
      .filter((m) => m.scoreBoostPotential > 0)
      .sort((a, b) => b.scoreBoostPotential - a.scoreBoostPotential)[0];

    if (improvableModule) {
      recommendedNextAction = {
        title: `🌟 ท้าทายคะแนนเต็ม: สอบซ้ำใน '${improvableModule.moduleTitle}'`,
        description: `ปัจจุบันได้ ${improvableModule.bestScore}/${improvableModule.maxPoints} คะแนน ทดสอบซ้ำเพื่อพิชิต Perfect Score 100% (+${improvableModule.scoreBoostPotential} แต้ม)`,
        targetModuleId: improvableModule.moduleId,
        targetModuleTitle: improvableModule.moduleTitle,
        actionType: 'boost',
        actionLabel: `ทดสอบซ้ำ (+${improvableModule.scoreBoostPotential} แต้ม)`,
        potentialPoints: improvableModule.scoreBoostPotential,
      };
    } else {
      recommendedNextAction = {
        title: 'ยอดเยี่ยมมาก! คุณผ่านบทเรียนทั้งหมดแล้ว',
        description: 'สามารถเลือกทำซ้ำบทเรียนใดก็ได้เพื่อรักษาความแม่นยำในการเขียนโค้ด SQL',
        actionType: 'all_mastered',
        actionLabel: 'เริ่มทำภารกิจ',
      };
    }
  }

  return {
    userId,
    userName,
    totalScoreEarned,
    totalPossibleScore,
    overallPercentage,
    overallGrade,
    masteryTitle,
    totalModulesCount,
    completedModulesCount,
    masteredModulesCount,
    completionRate,
    accuracyRate,
    totalMistakeDeductions,
    totalAttemptsCount,
    moduleProgressList,
    bestScorePotentialGain,
    recommendedNextAction,
  };
}

const PASSING_THRESHOLD_KEY = 'sql_passing_threshold';

/**
 * ดึงเกณฑ์ร้อยละการผ่านที่อาจารย์กำหนด (ค่าเริ่มต้น: 60%)
 */
export function getPassingThreshold(): number {
  try {
    const saved = localStorage.getItem(PASSING_THRESHOLD_KEY);
    if (saved !== null) {
      const num = parseFloat(saved);
      if (!isNaN(num) && num > 0 && num <= 100) {
        return num;
      }
    }
  } catch (e) {
    console.error('Failed to read passing threshold from localStorage:', e);
  }
  return 60; // Default 60%
}

/**
 * บันทึกเกณฑ์ร้อยละการผ่านที่อาจารย์กำหนด
 */
export function savePassingThreshold(threshold: number): void {
  try {
    const valid = Math.min(100, Math.max(1, Number(threshold) || 60));
    localStorage.setItem(PASSING_THRESHOLD_KEY, valid.toString());
  } catch (e) {
    console.error('Failed to save passing threshold to localStorage:', e);
  }
}


