import { useParams } from 'react-router-dom';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useParticipants } from '../../hooks/useParticipants';
import { useResponses } from '../../hooks/useResponses';
import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarConfig } from '../../utils/avatars';
import { AvatarShape } from '../../components/AvatarShape';
import { AnimatedCounter } from '../../components/AnimatedCounter';

export default function PresentationMode({ gameCodeProp }: { gameCodeProp?: string }) {
  const { sessionId } = useParams();
  const gameCode = gameCodeProp || (sessionId as string);
  const { session, loading } = useLiveSession(gameCode);
  const { participants } = useParticipants(gameCode);
  const { responses } = useResponses(gameCode, session?.currentAttemptId);
  
  const [visualCountdown, setVisualCountdown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (session?.status === 'active' && session.questionEndsAt) {
        const remaining = Math.ceil((session.questionEndsAt - now) / 1000);
        setVisualCountdown(Math.max(0, remaining));
      }
    }, 100);
    return () => clearInterval(timer);
  }, [session]);

  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (session?.quizId && session?.currentQuestionId) {
      adminService.getQuestions(session.quizId).then(qs => {
        const q = qs.find(q => q.id === session.currentQuestionId);
        if (q) setQuestion(q);
      });
    }
  }, [session?.currentQuestionId, session?.quizId]);

  const [leaderboardPhase, setLeaderboardPhase] = useState<'initial' | 'animated'>('initial');
  
  useEffect(() => {
    if (session?.status === 'leaderboard') {
      setLeaderboardPhase('initial');
      const timer = setTimeout(() => {
        setLeaderboardPhase('animated');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [session?.status]);

  if (loading) return <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex items-center justify-center text-6xl font-black uppercase tracking-widest">LOADING...</div>;
  if (!session) return <div className="min-h-screen bg-[var(--color-pastel-bg)] text-red-600 flex items-center justify-center text-6xl font-black uppercase shadow-[16px_16px_0_0_rgba(0,0,0,1)] bg-white border-[16px] border-black m-24 text-center p-24">SESSION ENDED</div>;

  const renderMedia = (q: Question | null, isIntro: boolean = false) => {
    if (!q || !q.mediaType || q.mediaType === 'text') return null;

    const mediaClass = isIntro 
      ? "w-full max-h-[70vh] object-contain border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] bg-white" 
      : "w-full max-h-[30vh] object-contain border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-white mb-8";

    if (q.mediaType === 'image') {
      return <img src={q.mediaUrl} alt="Question Media" className={mediaClass} />;
    }
    if (q.mediaType === 'video') {
      // Presentation screen plays video automatically
      return <video src={q.mediaUrl} autoPlay playsInline muted={false} className={mediaClass} />;
    }
    if (q.mediaType === 'audio') {
      return (
        <div className={`bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex items-center justify-center ${isIntro ? 'w-full max-w-4xl' : 'w-full mb-8'}`}>
          <div className="text-4xl font-black uppercase mr-8 text-black">Audio Clue</div>
          <audio src={q.mediaUrl} autoPlay controls className="w-full max-w-md" />
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (session.status) {
      case 'lobby':
        return (
          <div className="flex flex-col h-full w-full p-16 relative overflow-hidden bg-[var(--color-pastel-blue)]">
            
            <div className="z-10 absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex gap-12 items-center bg-white p-16 border-[16px] border-black shadow-[32px_32px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-right border-r-[16px] border-black pr-12">
                  <h1 className="text-8xl font-black uppercase leading-none mb-4 text-black">
                    The Room<br/>Is Open.
                  </h1>
                  <div className="text-5xl uppercase tracking-widest bg-[var(--color-pastel-pink)] text-black border-8 border-black inline-block px-6 py-3 font-black mt-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                    tday.test/join
                  </div>
                </div>

                <div className="text-center pl-4">
                  <div className="text-[12rem] font-black leading-none tracking-widest text-black underline decoration-[16px] decoration-[var(--color-pastel-green)] underline-offset-[24px]">
                    {gameCode}
                  </div>
                  <div className="text-5xl mt-16 font-black uppercase text-black bg-[var(--color-pastel-yellow)] border-8 border-black inline-block px-10 py-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    {participants.length} Joined
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'get_ready':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--color-pastel-yellow)]">
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="text-[12rem] font-black uppercase tracking-tighter text-black bg-white px-24 py-12 border-[16px] border-black shadow-[32px_32px_0px_0px_rgba(0,0,0,1)]"
            >
              Get Ready
            </motion.h1>
          </div>
        );

      case 'question_intro':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full p-24 text-center bg-[var(--color-pastel-pink)]">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="flex flex-col items-center justify-center w-full max-w-7xl"
            >
              {question?.mediaType && question.mediaType !== 'text' ? (
                <>
                  <div className="text-4xl font-black text-black mb-8 uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[var(--color-pastel-yellow)] inline-block px-8 py-4">
                    Question {session.currentQuestionIndex + 1}
                  </div>
                  {renderMedia(question, true)}
                </>
              ) : (
                <div className="bg-white border-[16px] border-black p-24 shadow-[32px_32px_0px_0px_rgba(0,0,0,1)] w-full">
                  <div className="text-4xl font-black text-black mb-12 uppercase border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[var(--color-pastel-yellow)] inline-block px-8 py-4">
                    Question {session.currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-[7rem] font-black leading-tight uppercase text-black">{question?.question}</h2>
                </div>
              )}
            </motion.div>
          </div>
        );

      case 'active':
        return (
          <div className="flex flex-col h-full p-16 w-full justify-between bg-[var(--color-pastel-blue)]">
            <div className="flex justify-between items-start mb-8 gap-8">
              <div className="flex-1 flex flex-col items-start">
                {renderMedia(question, false)}
                <div className="bg-white border-[12px] border-black px-12 py-8 w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-[5rem] font-black leading-tight uppercase text-black">{question?.question}</h2>
                </div>
              </div>
              <div className="text-right shrink-0 bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center min-w-[300px]">
                <div className={`text-[10rem] font-black leading-none tabular-nums ${visualCountdown <= 3 ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                  {visualCountdown}
                </div>
                <div className="text-4xl font-black uppercase mt-4 text-black border-t-8 border-black pt-4">
                  Seconds
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 w-full max-w-7xl mx-auto mt-auto">
              {question?.options.map((opt, i) => (
                <motion.div 
                  key={i} 
                  initial={{ x: -100, opacity: 0, rotate: -2 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5, delay: i * 0.15 }}
                  className="bg-white border-8 border-black p-12 flex items-center shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="w-24 h-24 bg-[var(--color-pastel-yellow)] border-8 border-black text-black flex items-center justify-center text-5xl font-black mr-12 rounded-full shrink-0 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                    {['A', 'B', 'C', 'D'][i]}
                  </div>
                  <div className="text-[3rem] leading-none font-black uppercase text-black">{opt}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 w-full">
              <div className="w-full h-12 bg-white border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${(visualCountdown / (question?.timeLimit || 20)) * 100}%` }}
                  transition={{ ease: "linear", duration: 1 }}
                  className={`h-full ${visualCountdown <= 3 ? 'bg-red-500' : 'bg-[var(--color-pastel-green)]'} border-r-8 border-black`}
                />
              </div>
            </div>
          </div>
        );

      case 'closed':
      case 'revealed':
        const counts = [0, 0, 0, 0];
        responses.forEach(r => { if (r.answer >= 0 && r.answer < 4) counts[r.answer]++; });
        const totalResponses = Math.max(responses.length, 1);
        
        return (
          <div className="flex flex-col h-full p-16 items-center justify-center w-full bg-[var(--color-pastel-purple)]">
            <h2 className="text-6xl font-black mb-16 text-center uppercase border-b-[12px] border-black pb-8 w-full max-w-7xl text-black bg-white border-[12px] px-12 py-8 shadow-[16px_16px_0_0_rgba(0,0,0,1)]">{question?.question}</h2>
            
            {session.status === 'closed' ? (
              <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[12rem] font-black uppercase text-black tracking-tighter shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] border-[16px] border-black bg-[var(--color-pastel-pink)] px-24 py-12 rotate-[-5deg]">
                Time's Up
              </motion.div>
            ) : (
              <div className="flex items-end justify-center h-[50vh] gap-12 w-full max-w-7xl">
                {question?.options.map((opt, i) => {
                  const heightPercent = (counts[i] / totalResponses) * 100; 
                  const isCorrect = i === question.correctAnswer;
                  
                  return (
                    <div key={i} className={`flex-1 flex flex-col justify-end items-center h-full transition-all duration-1000 ${!isCorrect ? 'opacity-40 grayscale' : 'opacity-100 scale-110 z-10'}`}>
                      <div className="text-[5rem] font-black mb-6 text-black bg-white border-8 border-black px-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                        <AnimatedCounter from={0} to={counts[i]} duration={2} delay={0.2} />
                      </div>
                      <div className="w-full relative flex justify-center items-end flex-1 px-4 min-h-[20px]">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(5, heightPercent)}%` }}
                          transition={{ duration: 2, type: "spring", bounce: 0.4, delay: 0.2 }}
                          className={`w-full border-8 border-b-0 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] ${isCorrect ? 'bg-[var(--color-pastel-green)]' : 'bg-gray-300'}`}
                        />
                      </div>
                      <div className={`mt-8 text-center border-8 border-black p-4 w-full shadow-[12px_12px_0_0_rgba(0,0,0,1)] ${isCorrect ? 'bg-[var(--color-pastel-yellow)]' : 'bg-white'}`}>
                        <div className={`text-4xl font-black mb-2 text-black border-b-4 border-black pb-2`}>
                          {isCorrect ? 'CORRECT' : ['A', 'B', 'C', 'D'][i]}
                        </div>
                        <div className="text-3xl font-black uppercase truncate text-black">{opt}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'leaderboard':
        const mappedParticipants = participants.map(p => {
          const response = responses.find(r => r.participantId === p.id);
          const pointsEarned = response?.points || 0;
          const previousScore = p.score - pointsEarned;
          const displayScore = leaderboardPhase === 'initial' ? previousScore : p.score;
          return { ...p, previousScore, displayScore };
        });

        const students = mappedParticipants.filter(p => p.group === 'students').sort((a, b) => b.displayScore - a.displayScore).slice(0, 5);
        const teachers = mappedParticipants.filter(p => p.group === 'teachers').sort((a, b) => b.displayScore - a.displayScore).slice(0, 5);
        
        const studentsPreviousTotal = mappedParticipants.filter(p => p.group === 'students').reduce((acc, p) => acc + p.previousScore, 0);
        const studentsCurrentTotal = mappedParticipants.filter(p => p.group === 'students').reduce((acc, p) => acc + p.score, 0);
        
        const teachersPreviousTotal = mappedParticipants.filter(p => p.group === 'teachers').reduce((acc, p) => acc + p.previousScore, 0);
        const teachersCurrentTotal = mappedParticipants.filter(p => p.group === 'teachers').reduce((acc, p) => acc + p.score, 0);

        return (
          <div className="flex flex-col h-full p-16 items-center w-full bg-[var(--color-pastel-green)]">
            <h2 className="text-[6rem] font-black mb-16 text-black tracking-widest uppercase bg-white border-[16px] border-black px-24 py-8 shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">Standings</h2>
            
            <div className="flex w-full gap-16 max-w-7xl">
              {/* STUDENTS LEADERBOARD */}
              <div className="flex-1 flex flex-col items-center">
                <div className="mb-8 text-center bg-[var(--color-pastel-blue)] text-black border-[12px] border-black p-8 w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
                  <h3 className="text-6xl font-black uppercase mb-4 border-b-8 border-black pb-4">Students</h3>
                  <div className="text-[5rem] font-black text-black bg-white inline-block px-8 py-2 border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] mt-4">
                    <AnimatedCounter 
                      from={studentsPreviousTotal} 
                      to={studentsCurrentTotal} 
                      duration={1.5} 
                      delay={leaderboardPhase === 'animated' ? 0 : 9999}
                    /> PTS
                  </div>
                </div>
                <div className="w-full space-y-6">
                  <AnimatePresence>
                    {students.map((p, i) => {
                      const avatar = getAvatarConfig(p.avatarId);
                      return (
                        <motion.div 
                          key={p.id} layout initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4, duration: 1 }}
                          className={`flex justify-between items-center bg-white border-8 p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${i === 0 ? 'border-black bg-[var(--color-pastel-yellow)] z-30 scale-105' : 'border-black opacity-90'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 flex items-center justify-center text-3xl font-black bg-black text-white rounded-full">{i + 1}</div>
                            <AvatarShape color={avatar.color} size={64} label={p.name} />
                            <div className="text-4xl font-black uppercase truncate max-w-[200px] text-black">{p.name}</div>
                          </div>
                          <div className="text-5xl font-black tabular-nums text-black bg-white border-4 border-black px-4 py-2">
                            <AnimatedCounter from={p.previousScore} to={p.score} duration={1.5} delay={leaderboardPhase === 'animated' ? 0 : 9999} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* TEACHERS LEADERBOARD */}
              <div className="flex-1 flex flex-col items-center">
                <div className="mb-8 text-center bg-[var(--color-pastel-orange)] text-black border-[12px] border-black p-8 w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]">
                  <h3 className="text-6xl font-black uppercase mb-4 border-b-8 border-black pb-4">Instructors</h3>
                  <div className="text-[5rem] font-black text-black bg-white inline-block px-8 py-2 border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] mt-4">
                    <AnimatedCounter 
                      from={teachersPreviousTotal} 
                      to={teachersCurrentTotal} 
                      duration={1.5} 
                      delay={leaderboardPhase === 'animated' ? 0 : 9999}
                    /> PTS
                  </div>
                </div>
                <div className="w-full space-y-6">
                  <AnimatePresence>
                    {teachers.map((p, i) => {
                      const avatar = getAvatarConfig(p.avatarId);
                      return (
                        <motion.div 
                          key={p.id} layout initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4, duration: 1 }}
                          className={`flex justify-between items-center bg-white border-8 p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${i === 0 ? 'border-black bg-[var(--color-pastel-yellow)] z-30 scale-105' : 'border-black opacity-90'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 flex items-center justify-center text-3xl font-black bg-black text-white rounded-full">{i + 1}</div>
                            <AvatarShape color={avatar.color} size={64} label={p.name} />
                            <div className="text-4xl font-black uppercase truncate max-w-[200px] text-black">{p.name}</div>
                          </div>
                          <div className="text-5xl font-black tabular-nums text-black bg-white border-4 border-black px-4 py-2">
                            <AnimatedCounter from={p.previousScore} to={p.score} duration={1.5} delay={leaderboardPhase === 'animated' ? 0 : 9999} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        );

      case 'finished_group':
        const finalStudents = participants.filter(p => p.group === 'students').reduce((acc, p) => acc + p.score, 0);
        const finalTeachers = participants.filter(p => p.group === 'teachers').reduce((acc, p) => acc + p.score, 0);
        const winGroup = finalStudents > finalTeachers ? 'Students' : finalTeachers > finalStudents ? 'Instructors' : 'Tie';
        
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--color-pastel-yellow)] text-center relative overflow-hidden">
            <h2 className="text-6xl font-black uppercase tracking-[1em] mb-12 z-10 bg-black text-white px-16 py-6 border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)]">Winning Group</h2>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6, duration: 1.5, delay: 0.5 }}
              className="z-10 flex flex-col items-center bg-[var(--color-pastel-pink)] border-[24px] border-black p-32 shadow-[48px_48px_0px_0px_rgba(0,0,0,1)] rotate-[-3deg]"
            >
              <div className="text-[14rem] font-black uppercase leading-none text-black mb-12 bg-white px-12 py-4 border-[12px] border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)]">
                {winGroup === 'Tie' ? "IT'S A TIE!" : winGroup}
              </div>
              <div className="text-[8rem] font-black text-black border-[12px] border-black bg-white px-12 py-6 inline-block shadow-[16px_16px_0_0_rgba(0,0,0,1)]">
                {Math.max(finalStudents, finalTeachers)} PTS
              </div>
            </motion.div>
          </div>
        );

      case 'finished_individual':
        const winner = participants.sort((a,b) => b.score - a.score)[0];
        const winnerAvatar = winner ? getAvatarConfig(winner.avatarId) : null;
        
        return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--color-pastel-blue)] text-center relative overflow-hidden">
            <h2 className="text-6xl font-black uppercase tracking-[1em] mb-12 z-10 bg-black text-white px-16 py-6 border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)]">Top Individual</h2>
            
            {winner && winnerAvatar && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.6, duration: 1.5, delay: 0.5 }}
                className="z-10 flex flex-col items-center bg-[var(--color-pastel-yellow)] border-[24px] border-black p-24 shadow-[48px_48px_0px_0px_rgba(0,0,0,1)] rotate-[2deg]"
              >
                <div className="bg-white border-[12px] border-black rounded-full shadow-[16px_16px_0_0_rgba(0,0,0,1)] mb-12">
                  <AvatarShape color={winnerAvatar.color} size={250} label={winner.name} />
                </div>
                <div className="text-[10rem] font-black uppercase leading-none text-black mb-8 bg-white border-[12px] border-black px-12 py-4 shadow-[16px_16px_0_0_rgba(0,0,0,1)]">
                  {winner.name}
                </div>
                <div className="text-5xl font-black text-black mb-8 uppercase tracking-widest border-b-8 border-black pb-4">
                  {winner.group === 'students' ? 'Student' : 'Instructor'}
                </div>
                <div className="text-[7rem] font-black text-black border-[12px] border-black bg-white px-12 py-6 inline-block shadow-[16px_16px_0_0_rgba(0,0,0,1)]">
                  {winner.score} PTS
                </div>
              </motion.div>
            )}
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-[var(--color-pastel-bg)] text-black overflow-hidden font-sans">
      {renderContent()}
    </div>
  );
}
