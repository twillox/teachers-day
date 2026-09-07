import { ref, update, set, get, serverTimestamp } from 'firebase/database';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { rtdb, db, auth } from '../firebase/config';
import type { LiveQuestionState } from '../types';

export const liveSessionService = {
  // Generate random 6-character game code
  generateGameCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createLiveSession(quizId: string): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const gameCode = this.generateGameCode();
    
    // Create Firestore metadata record
    const sessionDocRef = await addDoc(collection(db, 'sessions'), {
      quizId,
      gameCode,
      status: 'lobby',
      createdBy: currentUser.uid,
      createdAt: Date.now()
    });
    
    // Initialize RTDB active state
    const rtdbSessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    await set(rtdbSessionRef, {
      sessionId: sessionDocRef.id,
      quizId,
      status: 'lobby',
      createdBy: currentUser.uid,
      currentQuestionIndex: -1,
      currentQuestionId: null,
      questionStartedAt: null,
      questionEndsAt: null,
      participantCount: 0
    });

    return gameCode;
  },

  async setQuestionState(gameCode: string, state: LiveQuestionState) {
    const rtdbSessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    await update(rtdbSessionRef, {
      status: state
    });
  },

  async transitionToGetReady(gameCode: string) {
    const rtdbSessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    const now = Date.now();
    await update(rtdbSessionRef, {
      status: 'get_ready',
      introEndsAt: serverTimestamp(), // Just an immediate jump, but we can set it to +3s if we want to synchronize. The client will handle 3-2-1 visually anyway.
    });
  },

  async startQuestionIntro(gameCode: string, questionIndex: number, questionId: string, attemptId: string) {
    const rtdbSessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    const now = Date.now();
    // 3 second intro
    await update(rtdbSessionRef, {
      status: 'question_intro',
      currentQuestionIndex: questionIndex,
      currentQuestionId: questionId,
      currentAttemptId: attemptId,
      introEndsAt: now + 3000,
      questionStartedAt: null,
      questionEndsAt: null
    });
  },

  async activateQuestion(gameCode: string, timeLimitSeconds: number) {
    const rtdbSessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    const now = Date.now();
    await update(rtdbSessionRef, {
      status: 'active',
      questionStartedAt: serverTimestamp(),
      questionEndsAt: now + (timeLimitSeconds * 1000) + 1000, // Small grace period for latency
      introEndsAt: null
    });
  },

  async closeQuestion(gameCode: string) {
    await this.setQuestionState(gameCode, 'closed');
  },

  async revealAnswer(gameCode: string) {
    await this.setQuestionState(gameCode, 'revealed');
  },

  async showLeaderboard(gameCode: string) {
    await this.setQuestionState(gameCode, 'leaderboard');
  },

  async transitionToFinishedGroup(gameCode: string) {
    await this.setQuestionState(gameCode, 'finished_group');
  },

  async transitionToFinishedIndividual(gameCode: string, sessionId: string) {
    await this.setQuestionState(gameCode, 'finished_individual');
    
    // Mark as finished in Firestore
    const sessionDocRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDocRef, {
      status: 'finished',
      finishedAt: Date.now()
    });
  },

  // Emergency Pause/Resume
  async pauseEvent(gameCode: string) {
    await update(ref(rtdb, `live_sessions/${gameCode}`), { isPaused: true });
  },

  async resumeEvent(gameCode: string) {
    await update(ref(rtdb, `live_sessions/${gameCode}`), { isPaused: false });
  }
};
