import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-pastel-bg)] text-black flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="z-10 text-center space-y-12">
        <h1 className="text-[3.5rem] sm:text-[6rem] leading-none font-black tracking-tighter uppercase mb-6 sm:mb-8 break-words">
          Teachers' Day<br/>
          <span className="text-black bg-[var(--color-pastel-pink)] px-4 sm:px-8 py-2 border-4 sm:border-8 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] inline-block mt-2 sm:mt-4 rotate-[-2deg]">Live</span>
        </h1>
        <p className="text-xl sm:text-2xl font-black max-w-lg mx-auto uppercase bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          The ultimate real-time interactive quiz platform for college events.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center mt-12 sm:mt-16 w-full px-4 sm:px-0">
          <Link 
            to="/join" 
            className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-6 bg-[var(--color-pastel-yellow)] text-black font-black uppercase text-2xl sm:text-3xl border-4 sm:border-8 border-black hover:translate-y-2 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all"
          >
            JOIN QUIZ
          </Link>
          <Link 
            to="/admin/login" 
            className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-6 bg-white text-black font-black uppercase text-2xl sm:text-3xl border-4 sm:border-8 border-black hover:translate-y-2 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all"
          >
            HOST LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
