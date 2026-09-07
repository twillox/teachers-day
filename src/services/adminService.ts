import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { Quiz, Question } from '../types';

export const adminService = {
  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  },

  async getQuiz(quizId: string): Promise<Quiz | null> {
    const docRef = doc(db, 'quizzes', quizId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Quiz;
  },

  async createQuiz(title: string, description: string): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const docRef = await addDoc(collection(db, 'quizzes'), {
      title,
      description,
      createdBy: currentUser.uid,
      status: 'draft',
      questionCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return docRef.id;
  },

  // Questions
  async getQuestions(quizId: string): Promise<Question[]> {
    const q = query(collection(db, `quizzes/${quizId}/questions`), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  },

  async addQuestion(quizId: string, question: Partial<Question>): Promise<string> {
    const docRef = await addDoc(collection(db, `quizzes/${quizId}/questions`), {
      ...question,
      createdAt: Date.now()
    });
    
    // Update quiz question count
    const quizRef = doc(db, 'quizzes', quizId);
    const snap = await getDoc(quizRef);
    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(quizRef, {
        questionCount: (data.questionCount || 0) + 1,
        updatedAt: Date.now()
      });
    }

    return docRef.id;
  }
};
