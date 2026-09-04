export type UserRole = 'teacher' | 'student';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export type QuestionType = 'drag_drop' | 'fill_blank' | 'token_order' | 'free_type' | 'free_text';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: string;
  role: UserRole;
  username?: string;
  password?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  studentId?: string; // รหัสประจำตัวนักเรียน 11 หลัก
  gradeLevel?: string; // ระดับชั้น เช่น ม.1/1, ม.4/1, ปวช.1
  major?: string; // สาขาวิชา เช่น วิทยาการคอมพิวเตอร์, เทคโนโลยีสารสนเทศ, คอมพิวเตอร์ธุรกิจ, การบัญชี
  email?: string;
  avatar: string;
  status: UserStatus; // 'pending' | 'approved' | 'rejected'
  title?: string; // ตำแหน่ง / วิทยฐานะ (สำหรับครู)
  department?: string; // แผนก / กลุ่มสาระ (สำหรับครู)
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
}

export interface TableData {
  tableName: string;
  columns: TableColumn[];
  rows: Record<string, any>[];
  description?: string;
}

export interface Question {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  basePoints: number; // คะแนนเต็ม เช่น 10
  minPoints: number; // คะแนนขั้นต่ำ เช่น 1 หรือ 0 (default 0 หรือ 1)
  penaltyPerWrong?: number; // คะแนนที่จะหักเมื่อตอบผิดในแต่ละครั้ง เช่น 1, 2, 3, 5 (default 1)
  
  // Tables involved in this question for reference/execution
  targetTable: string;
  
  // The correct complete SQL query
  solutionSQL: string;
  
  // For Drag & Drop / Token Order: list of token blocks available
  availableTokens?: string[]; // e.g. ["SELECT", "name, grade", "FROM", "students", "WHERE", "grade = 'A'"]
  correctTokenOrder?: string[]; // matching order
  distractorTokens?: string[]; // extra deceptive tokens like ["ORDER BY", "HAVING", "GROUP BY"]
  
  // For Fill-in-the-blank: SQL template with placeholders like {{blank1}}, {{blank2}}
  blankTemplate?: string; // e.g. "SELECT {{b1}} FROM students WHERE {{b2}} >= 80;"
  blankAnswers?: Record<string, string[]>; // { b1: ["name", "student_name"], b2: ["score", "total_score"] }
  blankOptions?: Record<string, string[]>; // Optional multiple choice hints for each blank
  
  hint: string;
  explanation: string;
  createdAt?: string;
}

export interface QuizModule {
  id: string;
  title: string;
  description: string;
  iconName: string;
  difficulty: DifficultyLevel;
  targetMajor?: string; // สาขาวิชาเป้าหมาย เช่น 'ทุกสาขาวิชา', 'วิทยาการคอมพิวเตอร์', 'เทคโนโลยีสารสนเทศ'
  targetGradeLevel?: string; // ห้อง/ระดับชั้นเป้าหมาย เช่น 'ทุกห้อง', 'ม.4/1', 'ม.4/2', 'ปวช.1/1'
  questions: Question[];
}

export interface QuestionAttempt {
  questionId: string;
  questionTitle: string;
  attemptsCount: number;
  deductedPoints: number;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  userAnswer: string;
}

export interface GameSession {
  id: string;
  userId: string;
  userName: string;
  moduleId: string;
  moduleTitle: string;
  startTime: number;
  endTime?: number;
  currentQuestionIndex: number;
  totalScore: number;
  maxPossibleScore: number;
  questionAttempts: Record<string, QuestionAttempt>;
  isCompleted: boolean;
}

export interface StudentStats {
  userId: string;
  userName: string;
  totalScore: number;
  quizzesCompleted: number;
  accuracyRate: number;
  totalAttempts: number;
  lastPlayedAt: string;
}

export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  maxPoints: number;
  bestScore: number;
  latestScore: number;
  percentage: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'N/A';
  attemptsCount: number;
  completedAttemptsCount: number;
  status: 'not_started' | 'in_progress' | 'passed' | 'mastered';
  lastAttemptAt?: string;
  scoreBoostPotential: number; // Potential points that can be gained by retrying
  recommendation: {
    type: 'start' | 'next' | 'boost' | 'mastered';
    text: string;
    actionLabel: string;
    actionColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  };
}

export interface StudentDetailedEvaluation {
  userId: string;
  userName: string;
  totalScoreEarned: number;
  totalPossibleScore: number;
  overallPercentage: number;
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'N/A';
  masteryTitle: string;
  totalModulesCount: number;
  completedModulesCount: number;
  masteredModulesCount: number;
  completionRate: number;
  accuracyRate: number;
  totalMistakeDeductions: number;
  totalAttemptsCount: number;
  moduleProgressList: ModuleProgress[];
  bestScorePotentialGain: number;
  recommendedNextAction: {
    title: string;
    description: string;
    targetModuleId?: string;
    targetModuleTitle?: string;
    actionType: 'start' | 'next' | 'boost' | 'all_mastered';
    actionLabel: string;
    potentialPoints?: number;
  };
}
