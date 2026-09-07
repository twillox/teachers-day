import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useParticipants } from '../../hooks/useParticipants';
import { useCountdown } from '../../hooks/useCountdown';
import { participantService } from '../../services/participantService';
import { adminService } from '../../services/adminService';
import type { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarConfig } from '../../utils/avatars';
import { AvatarShape } from '../../components/AvatarShape';

export default function ParticipantGame() {
  const { gameCode } = useParams();
  const { session, loading, error } = useLiveSession(gameCode);
  const { participants } = useParticipants(gameCode);
  const countdown = useCountdown(session?.questionEndsAt, session?.isPaused);
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lastResult, setLastResult] = useState<{isCorrect: boolean, points: number} | null>(null);

  useEffect(() => {
    if (session?.quizId && session?.currentQuestionId) {
      adminService.getQuestions(session.quizId).then(qs => {
        const q = qs.find(q => q.id === session.currentQuestionId);
        if (q) setQuestion(q);
      });
      // Reset state if moving to a new question intro or get_ready
      if (session.status === 'get_ready' || session.status === 'question_intro') {
        setSelectedAnswer(null);
        setHasAnswered(false);
        setLastResult(null);
      }
    }
  }, [session?.currentQuestionId, session?.quizId, session?.status]);

  const identityStr = localStorage.getItem(`quiz_identity_${gameCode}`);
  const identity = identityStr ? JSON.parse(identityStr) : null;

  if (!identity) {
    return (
      <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex items-center justify-center p-6">
        <div className="bg-[var(--color-pastel-orange)] border-8 border-black p-8 text-3xl font-black uppercase shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">Identity lost. Rejoin.</div>
      </div>
    );
  }

  const avatar = getAvatarConfig(identity.avatarId);

  const handleSelectAnswer = async (index: number) => {
    if (session?.status !== 'active' || countdown <= 0 || hasAnswered || isSubmitting) return;
    
    setSelectedAnswer(index);
    setHasAnswered(true);
    setIsSubmitting(true);
    
    try {
      const result: any = await participantService.submitAnswer(
        gameCode as string, 
        identity.id, 
        session.currentQuestionId!, 
        index, 
        session.currentAttemptId!
      );
      setLastResult({ isCorrect: result.isCorrect, points: result.points });
    } catch (err) {
      console.error("Failed to submit", err);
      setHasAnswered(false);
      setSelectedAnswer(null);
      alert("Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMedia = (q: Question | null) => {
    if (!q || !q.mediaType || q.mediaType === 'text') return null;

    const mediaClass = "w-full max-h-[30vh] object-contain border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white mb-6";

    if (q.mediaType === 'image') {
      return <img src={q.mediaUrl} alt="Question Media" className={mediaClass} />;
    }
    if (q.mediaType === 'video') {
      // Mobile autoPlay works if user has interacted (they clicked "Join" already)
      return <video src={q.mediaUrl} autoPlay playsInline muted={false} className={mediaClass} />;
    }
    if (q.mediaType === 'audio') {
      return (
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center w-full mb-6 gap-2">
          <div className="text-xl font-black uppercase text-black">Audio Clue</div>
          <audio src={q.mediaUrl} autoPlay controls className="w-full" />
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) return <div className="text-4xl font-bold uppercase animate-pulse">Loading...</div>;
    if (error || !session) return <div className="text-4xl font-black text-red-600 uppercase bg-white p-6 border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">Session Not Found</div>;

    switch (session.status) {
      case 'lobby':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full w-full">
            <h1 className="text-4xl sm:text-[4rem] font-black uppercase mb-8 sm:mb-12 text-center">You're In.</h1>
            <div className="bg-white border-8 border-black rounded-full shadow-[8px_8px_0_0_rgba(0,0,0,1)] mb-8">
              <AvatarShape 
                color={avatar.color} 
                size={192} 
                label={identity.name} 
              />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase mb-6 sm:mb-8 text-center">{identity.name}</h2>
            <div className="bg-[var(--color-pastel-yellow)] border-4 sm:border-8 border-black px-4 sm:px-6 py-3 sm:py-4 font-black text-xl sm:text-2xl uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center">
              Waiting for Host
            </div>
          </motion.div>
        );

      case 'get_ready':
        return (
          <motion.div key="ready" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black bg-white px-6 sm:px-8 py-4 sm:py-6 border-4 sm:border-8 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] rotate-[-5deg] text-center">Get Ready</h1>
          </motion.div>
        );

      case 'question_intro':
        return (
          <motion.div key="intro" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center justify-center h-full p-4 text-center">
            {question?.mediaType && question.mediaType !== 'text' ? (
              <>
                <div className="text-black bg-[var(--color-pastel-yellow)] font-black text-2xl mb-8 border-4 border-black px-6 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  Q{session.currentQuestionIndex + 1}
                </div>
                {renderMedia(question)}
              </>
            ) : (
              <div className="bg-white border-8 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <div className="text-black bg-[var(--color-pastel-yellow)] font-black text-2xl mb-6 border-4 border-black px-6 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] inline-block">
                  Q{session.currentQuestionIndex + 1}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase leading-tight">{question?.question}</h2>
              </div>
            )}
          </motion.div>
        );

      case 'active':
        return (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full justify-between pb-8">
            <div className="flex justify-between items-end mb-6 pt-4 border-b-8 border-black pb-4">
              <div className="text-4xl sm:text-5xl font-black">{countdown}s</div>
              <div className="w-2/3 h-8 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${(countdown / (question?.timeLimit || 20)) * 100}%` }}
                  transition={{ ease: "linear", duration: 1 }}
                  className="h-full bg-[var(--color-pastel-green)] border-r-4 border-black"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-start">
              {renderMedia(question)}
              
              {question?.mediaType && question.mediaType !== 'text' && (
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] mb-6">
                  <h2 className="text-2xl font-black uppercase leading-tight">{question.question}</h2>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence>
                  {question?.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", delay: i * 0.1 }}
                      disabled={hasAnswered || countdown <= 0}
                      onClick={() => handleSelectAnswer(i)}
                      className={`
                        w-full text-left p-4 border-4 transition-all uppercase font-black text-xl flex items-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                        ${selectedAnswer === i 
                          ? 'bg-[var(--color-pastel-yellow)] border-black text-black translate-y-[2px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]' 
                          : 'bg-white border-black hover:bg-gray-100'}
                        ${hasAnswered && selectedAnswer !== i ? 'opacity-40 grayscale' : ''}
                      `}
                    >
                      <span className="w-10 h-10 bg-black text-white flex items-center justify-center mr-4 text-2xl font-black shrink-0">
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span className="flex-1">{hasAnswered && selectedAnswer === i ? 'LOCKED' : opt}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );

      case 'closed':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-black bg-[var(--color-pastel-orange)] px-6 sm:px-8 py-4 sm:py-6 border-4 sm:border-8 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] rotate-[5deg] text-center">Time's Up</h1>
          </motion.div>
        );

      case 'revealed':
        if (!lastResult) return (
          <div className="text-4xl font-black uppercase text-center mt-32 bg-white border-8 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            Look at the big screen!
          </div>
        );
        return (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center h-full w-full">
            <div className={`w-full border-8 p-12 text-center shadow-[12px_12px_0_0_rgba(0,0,0,1)] ${lastResult.isCorrect ? 'bg-[var(--color-pastel-green)] border-black text-black' : 'bg-[var(--color-pastel-pink)] border-black text-black'}`}>
              <h2 className="text-3xl sm:text-[4rem] font-black uppercase mb-6">{lastResult.isCorrect ? 'Correct' : 'Wrong'}</h2>
              {lastResult.isCorrect && (
                <div className="text-4xl font-black bg-white text-black inline-block px-6 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  +{lastResult.points}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'leaderboard':
        const groupParticipants = participants.filter(p => p.group === identity.group);
        const myRank = groupParticipants.sort((a,b) => b.score - a.score).findIndex(p => p.id === identity.id) + 1;
        
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-black uppercase text-center mb-8 bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              {identity.group === 'students' ? 'Student' : 'Instructor'} Standings
            </h1>
            <div className="text-6xl sm:text-[6rem] font-black text-black bg-[var(--color-pastel-yellow)] border-4 sm:border-8 border-black p-6 sm:p-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] rotate-[-2deg]">#{myRank > 0 ? myRank : '-'}</div>
            <div className="text-2xl font-black uppercase mt-6 bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[2deg]">Your Rank</div>
          </motion.div>
        );

      case 'finished_group':
        const studentsTotal = participants.filter(p => p.group === 'students').reduce((acc, p) => acc + p.score, 0);
        const teachersTotal = participants.filter(p => p.group === 'teachers').reduce((acc, p) => acc + p.score, 0);
        const winningGroup = studentsTotal > teachersTotal ? 'students' : teachersTotal > studentsTotal ? 'teachers' : 'tie';
        const myGroupWon = winningGroup === identity.group;
        
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
            <h1 className={`text-3xl sm:text-5xl font-black uppercase text-center p-6 sm:p-8 border-4 sm:border-8 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] ${myGroupWon ? 'bg-[var(--color-pastel-yellow)] text-black' : 'bg-gray-200 text-gray-500'}`}>
              {winningGroup === 'tie' ? "It's a Tie!" : myGroupWon ? 'Your Group Won!' : 'Your Group Lost!'}
            </h1>
          </motion.div>
        );

      case 'finished_individual':
        const overallWinner = [...participants].sort((a,b) => b.score - a.score)[0];
        const isMe = overallWinner?.id === identity.id;
        
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-black uppercase mb-8 bg-white border-4 border-black px-6 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">Overall Champion</h1>
            <div className={`text-4xl font-black p-8 border-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] ${isMe ? 'bg-[var(--color-pastel-yellow)] text-black border-black scale-110' : 'bg-white text-black border-black'}`}>
              {isMe ? 'YOU!' : overallWinner?.name}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-[var(--color-pastel-bg)] text-black p-6 font-sans flex flex-col overflow-hidden">
      <header className="flex justify-between items-center py-4 border-b-8 border-black shrink-0">
        <div className="text-3xl font-black uppercase tracking-widest bg-white text-black px-4 py-1 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">TDAY</div>
        {session?.status !== 'lobby' && (
          <div className="flex items-center gap-3 bg-white border-4 border-black px-3 py-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="font-black uppercase">{identity.name}</div>
            <AvatarShape color={avatar.color} size={24} label={identity.name} />
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col w-full max-w-lg mx-auto overflow-y-auto mt-4">
        {renderContent()}
      </main>
    </div>
  );
}
