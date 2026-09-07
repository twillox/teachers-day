import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { participantService } from '../../services/participantService';
import { getRandomAvatarId } from '../../utils/avatars';

export default function ParticipantJoin() {
  const [gameCode, setGameCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState<'students' | 'teachers' | null>(null);
  const [instructorKey, setInstructorKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setGameCode(codeParam.toUpperCase());
    }
  }, [location]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameCode || !name || !group) return;
    
    if (group === 'teachers' && instructorKey !== '0949') {
      setError('Invalid Instructor Key.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formattedCode = gameCode.toUpperCase().trim();
      const avatarId = getRandomAvatarId();
      await participantService.joinSession(formattedCode, name.trim(), avatarId, group);
      navigate(`/game/${formattedCode}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-white border-4 sm:border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-8 uppercase leading-none text-center">
          Join<br/><span className="text-[var(--color-pastel-pink)] bg-black px-4 inline-block mt-2 shadow-[4px_4px_0_0_var(--color-pastel-pink)]">The Event.</span>
        </h1>
        
        <form onSubmit={handleJoin} className="space-y-6">
          {error && <div className="p-4 bg-[var(--color-pastel-orange)] border-4 border-black text-black font-black text-xl uppercase text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{error}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => { setGroup('students'); setInstructorKey(''); setError(''); }}
              className={`p-4 sm:p-6 border-4 font-black text-xl sm:text-2xl uppercase transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${group === 'students' ? 'bg-[var(--color-pastel-blue)] text-black border-black translate-y-[2px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-gray-100 text-gray-500 border-black hover:bg-gray-200'}`}
            >
              I am a<br/>Student
            </button>
            <button 
              type="button" 
              onClick={() => { setGroup('teachers'); setError(''); }}
              className={`p-4 sm:p-6 border-4 font-black text-xl sm:text-2xl uppercase transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${group === 'teachers' ? 'bg-[var(--color-pastel-yellow)] text-black border-black translate-y-[2px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-gray-100 text-gray-500 border-black hover:bg-gray-200'}`}
            >
              I am an<br/>Instructor
            </button>
          </div>

          {group === 'teachers' && (
            <div>
              <label htmlFor="instructorKey" className="block text-xl font-black mb-2 uppercase text-black">Instructor Key</label>
              <input
                id="instructorKey"
                type="password"
                required
                maxLength={4}
                value={instructorKey}
                onChange={(e) => setInstructorKey(e.target.value)}
                className="w-full bg-white border-8 border-black px-4 py-4 text-3xl font-black tracking-widest text-black focus:outline-none focus:bg-[var(--color-pastel-yellow)] transition-colors uppercase text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
                placeholder="****"
              />
            </div>
          )}

          <div>
            <label htmlFor="gameCode" className="block text-xl sm:text-2xl font-black mb-2 uppercase">Game Code</label>
            <input
              id="gameCode"
              type="text"
              required
              maxLength={6}
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="w-full bg-white border-4 sm:border-8 border-black px-4 py-3 sm:py-4 text-3xl sm:text-4xl font-black tracking-widest text-black focus:outline-none focus:bg-[var(--color-pastel-pink)] transition-colors uppercase text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              placeholder="XXXXXX"
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-xl sm:text-2xl font-black mb-2 uppercase">Your Name</label>
            <input
              id="name"
              type="text"
              required
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border-4 sm:border-8 border-black px-4 py-3 sm:py-4 text-3xl sm:text-4xl font-black text-black focus:outline-none focus:bg-[var(--color-pastel-blue)] transition-colors uppercase text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              placeholder="NAME"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !gameCode || !name || !group || (group === 'teachers' && !instructorKey)}
            className="w-full bg-[var(--color-pastel-green)] text-black border-4 sm:border-8 border-black font-black text-3xl sm:text-4xl py-4 sm:py-6 hover:translate-y-2 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 mt-8 uppercase disabled:bg-gray-300"
          >
            {loading ? 'WAIT...' : 'ENTER ARENA'}
          </button>
        </form>
      </div>
    </div>
  );
}
