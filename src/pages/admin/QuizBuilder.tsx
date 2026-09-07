import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import type { Quiz, Question } from '../../types';
import Papa from 'papaparse';

export default function QuizBuilder() {
  const { quizId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timeLimit, setTimeLimit] = useState(20);
  const [points, setPoints] = useState(1000);
  const [mediaType, setMediaType] = useState<'text'|'image'|'video'|'audio'>('text');
  const [mediaUrl, setMediaUrl] = useState('');

  // Bulk Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const downloadTemplate = () => {
    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Time Limit', 'Points', 'Media Type', 'Media URL'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" +
      '"Sample Question","Answer 1","Answer 2","Answer 3","Answer 4","A","20","1000","text",""';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quiz_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          let currentOrder = questions.length;
          
          for (const row of rows) {
            const questionText = row['Question'];
            if (!questionText) continue;

            const opts = [
              row['Option A'] || '',
              row['Option B'] || '',
              row['Option C'] || '',
              row['Option D'] || ''
            ];

            const correctStr = (row['Correct Answer'] || 'A').toUpperCase().trim();
            let cAns = 0;
            if (correctStr === 'B') cAns = 1;
            if (correctStr === 'C') cAns = 2;
            if (correctStr === 'D') cAns = 3;

            const tLimit = parseInt(row['Time Limit']) || 20;
            const pts = parseInt(row['Points']) || 1000;
            const mType = (row['Media Type'] || 'text').toLowerCase().trim();
            const mUrl = row['Media URL'] || '';

            const questionData: any = {
              quizId,
              order: currentOrder++,
              question: questionText,
              type: 'multiple-choice',
              mediaType: ['text', 'image', 'video', 'audio'].includes(mType) ? mType : 'text',
              options: opts,
              correctAnswer: cAns,
              timeLimit: tLimit,
              points: pts
            };

            if (questionData.mediaType !== 'text' && mUrl) {
              questionData.mediaUrl = mUrl;
            }

            await adminService.addQuestion(quizId!, questionData);
          }

          const qs = await adminService.getQuestions(quizId!);
          setQuestions(qs);
        } catch (err: any) {
          setUploadError(err.message || 'Failed to upload questions');
        } finally {
          setIsUploading(false);
          e.target.value = '';
        }
      },
      error: (error) => {
        setUploadError(error.message);
        setIsUploading(false);
      }
    });
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }
    if (quizId) {
      Promise.all([
        adminService.getQuiz(quizId),
        adminService.getQuestions(quizId)
      ]).then(([q, qs]) => {
        setQuiz(q);
        setQuestions(qs);
        setLoading(false);
      });
    }
  }, [quizId, currentUser, navigate]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;
    
    const questionData: any = {
      quizId,
      order: questions.length,
      question: questionText,
      type: 'multiple-choice',
      mediaType,
      options,
      correctAnswer,
      timeLimit,
      points
    };
    if (mediaType !== 'text') {
      questionData.mediaUrl = mediaUrl;
    }

    await adminService.addQuestion(quizId, questionData);

    // Refresh
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setMediaType('text');
    setMediaUrl('');
    const qs = await adminService.getQuestions(quizId);
    setQuestions(qs);
  };

  if (loading) return <div className="p-8 text-black font-black uppercase">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-pastel-pink)] text-black p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12 border-b-4 md:border-b-8 border-black pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <button onClick={() => navigate('/admin')} className="text-black font-bold uppercase hover:bg-white px-4 py-2 border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all mb-4">&larr; Back to Dashboard</button>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase bg-white px-4 sm:px-6 py-2 sm:py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_0_rgba(0,0,0,1)] inline-block">{quiz?.title}</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* List */}
          <div>
            <h2 className="text-4xl font-black uppercase mb-8 bg-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">Questions ({questions.length})</h2>
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white border-8 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-black uppercase tracking-widest bg-[var(--color-pastel-blue)] px-3 py-1 border-4 border-black inline-block">
                      Q{i + 1} • {q.timeLimit}s • {q.points}pts
                    </div>
                    {q.mediaType && q.mediaType !== 'text' && (
                       <div className="font-bold uppercase tracking-widest bg-[var(--color-pastel-yellow)] px-3 py-1 border-4 border-black inline-block text-sm">
                         {q.mediaType}
                       </div>
                    )}
                  </div>
                  <div className="font-black text-2xl mb-6 uppercase">{q.question}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-bold uppercase">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={`p-4 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${idx === q.correctAnswer ? 'bg-[var(--color-pastel-green)]' : 'bg-gray-100'}`}>
                        {['A', 'B', 'C', 'D'][idx]}: {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form & Upload */}
          <div className="space-y-8 self-start sticky top-4 md:top-8">
            
            {/* Bulk Upload Box */}
            <div className="bg-[var(--color-pastel-blue)] p-4 sm:p-6 md:p-8 border-4 md:border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
              <h2 className="text-2xl sm:text-3xl font-black uppercase mb-4 inline-block bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">Bulk Upload</h2>
              <div className="space-y-4">
                <button onClick={downloadTemplate} type="button" className="w-full bg-white border-4 border-black text-black font-bold uppercase py-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
                  Download CSV Template
                </button>
                <div className="relative">
                  <input type="file" accept=".csv" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  <div className={`w-full border-4 border-black text-black font-black uppercase py-4 text-center transition-all ${isUploading ? 'bg-gray-300' : 'bg-[var(--color-pastel-green)] hover:translate-y-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]'}`}>
                    {isUploading ? 'Uploading...' : 'Upload Filled CSV'}
                  </div>
                </div>
                {uploadError && <div className="bg-[var(--color-pastel-pink)] text-black font-bold p-3 border-4 border-black uppercase text-sm mt-2">{uploadError}</div>}
              </div>
            </div>

            {/* Manual Form */}
            <div className="bg-white p-4 sm:p-6 md:p-8 border-4 md:border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase mb-6 md:mb-8 inline-block bg-[var(--color-pastel-orange)] px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">Add Question</h2>
              <form onSubmit={handleAddQuestion} className="space-y-4 sm:space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xl font-black uppercase mb-2">Media Type</label>
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value as any)}
                    className="w-full bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 text-black font-bold uppercase"
                  >
                    <option value="text">Text Only</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>

              {mediaType !== 'text' && (
                <div>
                  <label className="block text-xl font-black uppercase mb-2">Media URL</label>
                  <input
                    type="url"
                    required
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    placeholder={`https://example.com/file.${mediaType === 'image' ? 'jpg' : 'mp4'}`}
                    className="w-full bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 text-black font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xl font-black uppercase mb-2">Question Text</label>
                <textarea
                  required
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  className="w-full bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-4 text-black font-bold text-lg min-h-[120px]"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xl font-black uppercase mb-2">Options & Correct Answer</label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <input 
                      type="radio" 
                      name="correctAnswer" 
                      checked={correctAnswer === i}
                      onChange={() => setCorrectAnswer(i)}
                      className="w-8 h-8 accent-black"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...options];
                        newOpts[i] = e.target.value;
                        setOptions(newOpts);
                      }}
                      className="flex-1 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 text-black font-bold uppercase"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-4 md:pt-6">
                <div className="flex-1">
                  <label className="block text-xl font-black uppercase mb-2">Time Limit (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={timeLimit}
                    onChange={e => setTimeLimit(parseInt(e.target.value))}
                    className="w-full bg-[var(--color-pastel-blue)] border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 text-black font-black text-xl text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xl font-black uppercase mb-2">Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={e => setPoints(parseInt(e.target.value))}
                    className="w-full bg-[var(--color-pastel-green)] border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 text-black font-black text-xl text-center"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-[var(--color-pastel-yellow)] border-8 border-black text-black font-black text-3xl uppercase py-6 mt-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-y-2 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all">
                ADD QUESTION
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
