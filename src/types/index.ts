export type Role = 'admin' | 'participant';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  questionCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  quizId: string;
  order: number;
  question: string;
  type: 'multiple-choice';
  options: string[]; // typically 4 options
  correctAnswer: number; // index of correct option (0-3)
  timeLimit: number; // in seconds
  points: number; // base points
  mediaType?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  imageUrl?: string;
  createdAt: number;
}

// Live Session (Metadata in Firestore, active state in RTDB)
export interface Session {
  id: string;
  quizId: string;
  gameCode: string;
  status: 'lobby' | 'active' | 'finished';
  createdBy: string;
  createdAt: number;
}

export type LiveQuestionState = 'lobby' | 'get_ready' | 'question_intro' | 'active' | 'closed' | 'revealed' | 'leaderboard' | 'finished_group' | 'finished_individual';

// RTDB Structure for active session
export interface LiveSessionState {
  sessionId: string;
  status: LiveQuestionState;
  quizId: string;
  currentQuestionIndex: number;
  currentQuestionId: string | null;
  currentAttemptId?: string;
  isPaused?: boolean;
  questionStartedAt: number | null; // Server timestamp (when active starts)
  questionEndsAt: number | null; // Server timestamp
  introEndsAt: number | null; // Server timestamp (when get_ready or intro ends)
  participantCount: number;
}

export interface Participant {
  id: string;
  name: string;
  avatarId: string;
  group: 'students' | 'teachers';
  joinedAt: number;
  connected: boolean;
  score: number;
  rank: number;
  correctAnswers: number;
  answeredQuestions: number;
  lastActiveAt: number;
  streak: number;
  bestStreak: number;
  cumulativeResponseTime: number; // For tie-breaking
}

export interface Response {
  id: string;
  participantId: string;
  questionId: string;
  answer: number;
  isCorrect: boolean;
  responseTime: number;
  points: number;
  submittedAt: number; // Server timestamp
}

export interface QuestionAttempt {
  attemptId: string;
  startedAt: number;
}
