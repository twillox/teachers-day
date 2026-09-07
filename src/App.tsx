import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizBuilder from './pages/admin/QuizBuilder';
import LiveControlCenter from './pages/admin/LiveControlCenter';
import SeedData from './pages/admin/SeedData';
import ParticipantJoin from './pages/participant/ParticipantJoin';
import ParticipantGame from './pages/participant/ParticipantGame';
import PresentationMode from './pages/presentation/PresentationMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Participant */}
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<ParticipantJoin />} />
        <Route path="/game/:gameCode" element={<ParticipantGame />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/quizzes/:quizId" element={<QuizBuilder />} />
        <Route path="/admin/live/:sessionId" element={<LiveControlCenter />} />
        <Route path="/admin/seed" element={<SeedData />} />
        
        {/* Presentation */}
        <Route path="/present/:sessionId" element={<PresentationMode />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
