import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black mb-8 text-center uppercase tracking-widest bg-[var(--color-pastel-yellow)] border-4 border-black inline-block px-6 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[-2deg]">Admin Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-4 bg-[var(--color-pastel-orange)] border-4 border-black text-black font-black uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{error}</div>}
          
          <div>
            <label className="block text-xl font-black mb-2 uppercase">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-4 border-black p-4 text-black font-bold focus:outline-none focus:bg-[var(--color-pastel-blue)] shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xl font-black mb-2 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-4 border-black p-4 text-black font-bold focus:outline-none focus:bg-[var(--color-pastel-blue)] shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-colors"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-pastel-green)] text-black font-black uppercase text-2xl py-4 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all mt-8 disabled:opacity-50 disabled:bg-gray-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
