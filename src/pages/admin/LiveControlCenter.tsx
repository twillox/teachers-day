import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useParticipants } from '../../hooks/useParticipants';
import { useResponses } from '../../hooks/useResponses';
import { liveSessionService } from '../../services/liveSessionService';
import { adminService } from '../../services/adminService';
import type { Question, Quiz } from '../../types';
import PresentationMode from '../presentation/PresentationMode';

export default function LiveControlCenter() {
  const { sessionId } = useParams(); 
  const gameCode = sessionId as string;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const { session, loading, error } = useLiveSession(gameCode);
  const { participants } = useParticipants(gameCode);
  const { responses } = useResponses(gameCode, session?.currentAttemptId);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Recovery safe timeout for question_intro -> active
  const introTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session?.quizId) {
      adminService.getQuiz(session.quizId).then(setQuiz);
      adminService.getQuestions(session.quizId).then(setQuestions);
    }
  }, [session?.quizId]);

  useEffect(() => {
    if (session?.status === 'question_intro' && session.introEndsAt) {
      const q = questions[session.currentQuestionIndex];
      // Don't auto-advance if it's a media question, wait for manual "SHOW OPTIONS" click
      if (q && q.mediaType && q.mediaType !== 'text') {
        return;
      }

      const remaining = session.introEndsAt - Date.now();
      if (remaining > 0) {
        if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
        introTimeoutRef.current = setTimeout(() => {
          if (q) liveSessionService.activateQuestion(gameCode, q.timeLimit);
        }, remaining);
      } else {
        if (q) liveSessionService.activateQuestion(gameCode, q.timeLimit);
      }
    }
    return () => {
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    };
  }, [session?.status, session?.introEndsAt, session?.currentQuestionIndex, questions, gameCode]);

  if (!currentUser) {
    return <div className="min-h-screen bg-[var(--color-pastel-bg)] flex items-center justify-center text-black text-4xl uppercase font-black">Authentication Required</div>;
  }

  if (loading) return <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex items-center justify-center text-4xl uppercase font-black tracking-widest">LOADING CONTROL ROOM...</div>;
  if (error || !session) return <div className="min-h-screen bg-[var(--color-pastel-bg)] text-red-600 flex items-center justify-center text-5xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-12 bg-white border-8 border-black m-12 text-center">SESSION NOT FOUND</div>;

  const currentQuestion = session.currentQuestionIndex >= 0 ? questions[session.currentQuestionIndex] : null;

  const handleStartSession = async () => {
    if (questions.length === 0) return alert("No questions.");
    await liveSessionService.transitionToGetReady(gameCode);
  };

  const handleStartQuestion = async () => {
    const isFirstQuestion = session.currentQuestionIndex === -1;
    const nextIndex = isFirstQuestion ? 0 : session.currentQuestionIndex;
    const q = questions[nextIndex];
    if (!q) return;
    
    const attemptId = `attempt_${Date.now()}`;
    await liveSessionService.startQuestionIntro(gameCode, nextIndex, q.id, attemptId);
  };

  const handleNextQuestion = async () => {
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      return liveSessionService.transitionToFinishedGroup(gameCode);
    }
    await liveSessionService.transitionToGetReady(gameCode);
  };

  const handleStartQuestionNext = async () => {
    const nextIndex = session.currentQuestionIndex + 1;
    const q = questions[nextIndex];
    if (!q) return;
    const attemptId = `attempt_${Date.now()}`;
    await liveSessionService.startQuestionIntro(gameCode, nextIndex, q.id, attemptId);
  }

  const handleCloseQuestion = async () => {
    await liveSessionService.closeQuestion(gameCode);
  };

  const handleRevealAnswer = async () => {
    await liveSessionService.revealAnswer(gameCode);
  };

  const handleShowLeaderboard = async () => {
    await liveSessionService.showLeaderboard(gameCode);
  };

  return (
    <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black p-6 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-8 border-black p-6 bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center gap-8">
          <div className="bg-[var(--color-pastel-pink)] text-black font-black px-6 py-3 uppercase tracking-widest flex items-center gap-3 border-4 border-black">
            <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse border-2 border-black"></span>
            ON AIR
          </div>
          <h1 className="text-4xl font-black uppercase text-black">{quiz?.title || 'Live Event'}</h1>
        </div>
        <div className="flex gap-16 text-right">
          <div>
            <div className="text-lg font-bold text-gray-600 uppercase tracking-widest">Game Code</div>
            <div className="text-5xl font-black text-black">{gameCode}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600 uppercase tracking-widest">Participants</div>
            <div className="text-5xl font-black text-black">{participants.length}</div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: LIVE PREVIEW & STATS */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="bg-white border-8 border-black flex-1 relative overflow-hidden flex flex-col shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
            <div className="bg-[var(--color-pastel-blue)] border-b-8 border-black text-black font-black uppercase px-6 py-3 flex justify-between text-xl">
              <span>Live Broadcast Preview</span>
              <span>1920x1080 (Scaled)</span>
            </div>
            <div className="flex-1 relative bg-gray-200 overflow-hidden flex items-center justify-center">
              <div 
                className="absolute w-[1920px] h-[1080px] origin-center" 
                style={{ transform: 'scale(0.35)' }}
              >
                <div className="w-full h-full pointer-events-none border-[16px] border-black bg-white">
                  <PresentationMode gameCodeProp={gameCode} />
                </div>
              </div>
            </div>
          </div>

          <div className="h-36 bg-[var(--color-pastel-purple)] border-8 border-black p-8 flex justify-between items-center shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
            <div>
              <div className="text-black font-black uppercase tracking-widest mb-2 bg-white px-3 py-1 inline-block border-4 border-black">Question {session.currentQuestionIndex >= 0 ? session.currentQuestionIndex + 1 : '-'}</div>
              <div className="text-6xl font-black mt-2">{responses.length} <span className="text-3xl text-black">/ {participants.length} Answered</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL PANEL */}
        <div className="w-[450px] bg-white border-8 border-black flex flex-col shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
          <div className="bg-[var(--color-pastel-yellow)] border-b-8 border-black text-black font-black uppercase px-6 py-4 text-2xl text-center">
            Switcher Controls
          </div>
          
          <div className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
            <div className="mb-6">
              <div className="text-gray-600 font-black uppercase tracking-widest mb-3">Current State</div>
              <div className="text-4xl font-black text-black uppercase border-8 border-black p-6 text-center bg-[var(--color-pastel-blue)] shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                {session.status.replace('_', ' ')}
              </div>
            </div>

            {session.status === 'lobby' && (
              <button onClick={handleStartSession} className="w-full py-6 bg-white text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                GET READY
              </button>
            )}

            {session.status === 'get_ready' && (
              <button onClick={session.currentQuestionIndex === -1 ? handleStartQuestion : handleStartQuestionNext} className="w-full py-6 bg-[var(--color-pastel-green)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                START QUESTION
              </button>
            )}

            {session.status === 'question_intro' && (
              currentQuestion?.mediaType && currentQuestion.mediaType !== 'text' ? (
                <button onClick={() => liveSessionService.activateQuestion(gameCode, currentQuestion.timeLimit)} className="w-full py-6 bg-[var(--color-pastel-green)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all animate-pulse">
                  SHOW OPTIONS
                </button>
              ) : (
                <button disabled className="w-full py-6 bg-gray-200 text-gray-500 font-black text-3xl uppercase border-8 border-gray-400">
                  INTRODUCING...
                </button>
              )
            )}

            {session.status === 'active' && (
              <button onClick={handleCloseQuestion} className="w-full py-6 bg-[var(--color-pastel-orange)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                CLOSE QUESTION
              </button>
            )}

            {session.status === 'closed' && (
              <button onClick={handleRevealAnswer} className="w-full py-6 bg-[var(--color-pastel-blue)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                REVEAL ANSWER
              </button>
            )}

            {(session.status === 'revealed' || session.status === 'closed') && (
              <button onClick={handleShowLeaderboard} className="w-full py-6 bg-[var(--color-pastel-purple)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all mt-4">
                SHOW LEADERBOARD
              </button>
            )}

            {session.status === 'leaderboard' && session.currentQuestionIndex < questions.length - 1 && (
              <button onClick={() => liveSessionService.transitionToGetReady(gameCode)} className="w-full py-6 bg-white text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                NEXT QUESTION
              </button>
            )}

            {session.status === 'leaderboard' && session.currentQuestionIndex >= questions.length - 1 && (
              <button onClick={() => liveSessionService.transitionToFinishedGroup(gameCode)} className="w-full py-6 bg-[var(--color-pastel-green)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                SHOW WINNING GROUP
              </button>
            )}

            {session.status === 'finished_group' && (
              <button onClick={() => liveSessionService.transitionToFinishedIndividual(gameCode, session.sessionId)} className="w-full py-6 bg-[var(--color-pastel-yellow)] text-black font-black text-3xl uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                SHOW TOP INDIVIDUAL
              </button>
            )}

            {session.status === 'finished_individual' && (
              <button disabled className="w-full py-6 bg-black text-white border-8 border-black font-black text-3xl uppercase">
                EVENT CONCLUDED
              </button>
            )}

            {/* Universal Override Leaderboard */}
            <div className="mt-auto pt-8 border-t-8 border-black">
               <button onClick={handleShowLeaderboard} className="w-full py-4 bg-transparent border-4 border-black text-black font-black text-xl uppercase hover:bg-gray-200 transition-colors">
                FORCE LEADERBOARD
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
