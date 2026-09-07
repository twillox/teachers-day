import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { liveSessionService } from '../../services/liveSessionService';
import type { Quiz } from '../../types';
import { LogOut, Plus, Play } from 'lucide-react';
import { auth } from '../../firebase/config';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }

    adminService.getQuizzes().then(data => {
      setQuizzes(data);
      setLoading(false);
    });
  }, [currentUser, navigate]);

  const handleCreateQuiz = async () => {
    const title = prompt("Enter Quiz Title");
    if (!title) return;
    const id = await adminService.createQuiz(title, "Teachers' Day Quiz");
    navigate(`/admin/quizzes/${id}`);
  };

  const handleStartSession = async (quizId: string) => {
    try {
      const gameCode = await liveSessionService.createLiveSession(quizId);
      navigate(`/admin/live/${gameCode}`);
    } catch (e) {
      console.error(e);
      alert("Failed to start session");
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/admin/login');
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-pastel-blue)] text-black p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 border-b-4 md:border-b-8 border-black pb-4 md:pb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-black uppercase text-black bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-center w-full md:w-auto">TDAY Admin</h1>
          <button onClick={handleLogout} className="flex justify-center w-full md:w-auto items-center text-black font-bold uppercase hover:bg-white px-4 py-2 border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </button>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 gap-4">
          <h2 className="text-2xl md:text-4xl font-black uppercase bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-full md:w-auto text-center">Your Quizzes</h2>
          <button onClick={handleCreateQuiz} className="flex justify-center w-full md:w-auto items-center bg-[var(--color-pastel-green)] text-black px-6 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_0_rgba(0,0,0,1)] font-black uppercase hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
            <Plus className="w-6 h-6 mr-2" /> New Quiz
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="bg-white p-8 border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-black mb-2 uppercase">{quiz.title}</h3>
                <p className="text-gray-600 font-bold uppercase tracking-widest mb-6 bg-gray-200 inline-block px-3 py-1 border-2 border-black">{quiz.questionCount} Questions</p>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                  className="flex-1 bg-[var(--color-pastel-yellow)] border-4 border-black py-3 font-black uppercase hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleStartSession(quiz.id)}
                  className="flex-1 bg-[var(--color-pastel-pink)] border-4 border-black py-3 font-black uppercase flex items-center justify-center hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <Play className="w-5 h-5 mr-1" fill="currentColor" /> LIVE
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full p-16 border-8 border-dashed border-black bg-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center text-black font-black uppercase text-2xl">
              No quizzes found. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
