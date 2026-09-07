"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartQuestion = exports.submitAnswer = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const getDb = () => admin.firestore();
const getRtdb = () => admin.database();
exports.submitAnswer = functions.https.onCall(async (data, context) => {
    const { gameCode, participantId, questionId, answer, attemptId } = data;
    if (!gameCode || !participantId || !questionId || answer === undefined || !attemptId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }
    const sessionRef = getRtdb().ref(`live_sessions/${gameCode}`);
    const sessionSnap = await sessionRef.once("value");
    if (!sessionSnap.exists()) {
        throw new functions.https.HttpsError("not-found", "Session not found.");
    }
    const sessionState = sessionSnap.val();
    if (sessionState.status !== "active") {
        throw new functions.https.HttpsError("failed-precondition", "Question is not currently active.");
    }
    if (sessionState.currentQuestionId !== questionId) {
        throw new functions.https.HttpsError("failed-precondition", "Mismatch in current question.");
    }
    if (sessionState.currentAttemptId !== attemptId) {
        throw new functions.https.HttpsError("failed-precondition", "This attempt is no longer valid (question restarted).");
    }
    const now = Date.now();
    const endsAt = sessionState.questionEndsAt;
    const startedAt = sessionState.questionStartedAt;
    // Allow 2000ms grace period for network latency
    if (now > endsAt + 2000) {
        throw new functions.https.HttpsError("out-of-range", "Time is up.");
    }
    // Prevent duplicate submissions
    const responseRef = getRtdb().ref(`live_sessions/${gameCode}/responses/${attemptId}/${participantId}`);
    const responseSnap = await responseRef.once("value");
    if (responseSnap.exists()) {
        throw new functions.https.HttpsError("already-exists", "You have already answered this question.");
    }
    // Fetch question details to verify correct answer securely
    const quizId = sessionState.quizId;
    const questionRef = getDb().collection(`quizzes/${quizId}/questions`).doc(questionId);
    const questionSnap = await questionRef.get();
    if (!questionSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Question not found.");
    }
    const questionData = questionSnap.data();
    const correctAnswer = questionData?.correctAnswer;
    const basePoints = questionData?.points || 1000;
    const timeLimit = questionData?.timeLimit || 20;
    const isCorrect = answer === correctAnswer;
    let points = 0;
    let responseTime = now - startedAt;
    if (isCorrect) {
        // Max score is basePoints. Decrease based on time taken.
        const timeRatio = Math.max(0, 1 - (responseTime / (timeLimit * 1000)));
        // Minimum 50% of points if correct
        const speedBonus = basePoints * 0.5 * timeRatio;
        points = Math.round(basePoints * 0.5 + speedBonus);
    }
    const responseData = {
        participantId,
        questionId,
        answer,
        isCorrect,
        responseTime,
        points,
        submittedAt: admin.database.ServerValue.TIMESTAMP
    };
    // Run as a transaction to safely update score and responses
    const participantRef = getRtdb().ref(`live_sessions/${gameCode}/participants/${participantId}`);
    await responseRef.set(responseData);
    await participantRef.transaction((participant) => {
        if (participant) {
            participant.answeredQuestions = (participant.answeredQuestions || 0) + 1;
            participant.cumulativeResponseTime = (participant.cumulativeResponseTime || 0) + responseTime;
            if (isCorrect) {
                participant.score = (participant.score || 0) + points;
                participant.correctAnswers = (participant.correctAnswers || 0) + 1;
                participant.streak = (participant.streak || 0) + 1;
                if (participant.streak > (participant.bestStreak || 0)) {
                    participant.bestStreak = participant.streak;
                }
            }
            else {
                participant.streak = 0;
            }
        }
        return participant;
    });
    return { success: true, isCorrect, points };
});
exports.restartQuestion = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
    }
    const { gameCode } = data;
    if (!gameCode) {
        throw new functions.https.HttpsError("invalid-argument", "Missing gameCode.");
    }
    const sessionRef = getRtdb().ref(`live_sessions/${gameCode}`);
    const sessionSnap = await sessionRef.once("value");
    if (!sessionSnap.exists()) {
        throw new functions.https.HttpsError("not-found", "Session not found.");
    }
    const sessionState = sessionSnap.val();
    if (sessionState.createdBy !== context.auth.uid) {
        throw new functions.https.HttpsError("permission-denied", "Only the host can restart.");
    }
    // Create new attempt ID
    const newAttemptId = `attempt_${Date.now()}`;
    await sessionRef.update({
        currentAttemptId: newAttemptId,
        status: 'lobby', // Or directly active, but lobby gives host control
        questionStartedAt: null,
        questionEndsAt: null
    });
    return { success: true, newAttemptId };
});
//# sourceMappingURL=index.js.map