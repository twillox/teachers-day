import { ref, set, serverTimestamp, get, onDisconnect, update } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { rtdb, functions } from '../firebase/config';
import type { Participant } from '../types';

export const participantService = {
  async joinSession(gameCode: string, name: string, avatarId: string, group: 'students' | 'teachers'): Promise<Participant> {
    // Check if session exists first
    const sessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    const sessionSnap = await get(sessionRef);
    if (!sessionSnap.exists()) {
      throw new Error('Session not found or invalid game code.');
    }

    // Recover identity from localStorage
    const savedIdentityStr = localStorage.getItem(`quiz_identity_${gameCode}`);
    let participantId: string;
    let participantData: Partial<Participant>;

    if (savedIdentityStr) {
      const savedIdentity = JSON.parse(savedIdentityStr);
      participantId = savedIdentity.id;
      
      // Update existing record
      const pRef = ref(rtdb, `live_sessions/${gameCode}/participants/${participantId}`);
      await update(pRef, {
        connected: true,
        lastActiveAt: serverTimestamp()
      });
      
      const snap = await get(pRef);
      participantData = snap.val();
      
    } else {
      // Create new participant
      participantId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      participantData = {
        id: participantId,
        name,
        avatarId,
        group,
        joinedAt: Date.now(),
        connected: true,
        score: 0,
        rank: 0,
        correctAnswers: 0,
        answeredQuestions: 0,
        lastActiveAt: Date.now(),
        streak: 0,
        bestStreak: 0,
        cumulativeResponseTime: 0
      };

      const pRef = ref(rtdb, `live_sessions/${gameCode}/participants/${participantId}`);
      await set(pRef, participantData);

      localStorage.setItem(`quiz_identity_${gameCode}`, JSON.stringify({ id: participantId, name, avatarId, group }));
      
      // Update participant count
      await update(sessionRef, {
        participantCount: (sessionSnap.val().participantCount || 0) + 1
      });
    }

    // Handle presence
    const presenceRef = ref(rtdb, `live_sessions/${gameCode}/participants/${participantId}/connected`);
    onDisconnect(presenceRef).set(false);

    return participantData as Participant;
  },

  async submitAnswer(gameCode: string, participantId: string, questionId: string, answer: number, attemptId: string) {
    const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
    const result = await submitAnswerFn({
      gameCode,
      participantId,
      questionId,
      answer,
      attemptId
    });
    return result.data;
  }
};
