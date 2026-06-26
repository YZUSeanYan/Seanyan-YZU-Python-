export type QuestionType = 'single' | 'fill' | 'codeFill' | 'codeFix';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Blank {
  id: number;
  position: [number, number];
  answer: string;
}

export interface Question {
  id: number;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  content: string;
  options?: string[];
  code?: string;
  blanks?: Blank[];
  answer: string | string[];
  explanation: string;
  tags: string[];
}

export interface UserAnswer {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  timeSpent: number;
}

export interface WrongAnswer {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  wrongCount: number;
  lastWrongAt: string;
  isMastered: boolean;
  attempts: number;
}

export interface StudyStats {
  totalAnswered: number;
  totalCorrect: number;
  correctRate: number;
  streakDays: number;
  lastStudyDate: string;
  byType: {
    type: string;
    answered: number;
    correct: number;
  }[];
  byCategory: {
    category: string;
    answered: number;
    correct: number;
  }[];
  dailyActivity: {
    date: string;
    answered: number;
    correct: number;
  }[];
  weakAreas: string[];
}

export interface ActivityEntry {
  id: string;
  questionId: number;
  questionType: QuestionType;
  questionContent: string;
  isCorrect: boolean;
  answeredAt: string;
  timeSpent: number;
}

// ============ Auth System Types ============

export interface User {
  id: string;
  studentId: string; // 学号，如 "2024001"
  name: string;
  password: string; // 明文存储（本地应用，非生产环境）
  role: 'student' | 'admin';
  remarkName?: string;
  practice2Enabled?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

export interface ExamRecord {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpent: number; // seconds
  byType: Record<string, { correct: number; total: number }>;
}

export interface UserData {
  userId: string;
  wrongAnswers: WrongAnswer[];
  studyStats: StudyStats;
  memoryStatus: Record<number, string>;
  examHistory: ExamRecord[];
}
