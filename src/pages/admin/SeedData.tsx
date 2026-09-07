import { useState } from 'react';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

const sampleQuestions = [
  {
    question: "Who is known as the Missile Man of India?",
    options: ["Dr. Homi J. Bhabha", "Dr. A.P.J. Abdul Kalam", "Vikram Sarabhai", "C.V. Raman"],
    correctAnswer: 1,
    timeLimit: 20,
    points: 1000
  },
  {
    question: "Teachers' Day in India is celebrated on the birthday of which eminent personality?",
    options: ["Dr. Rajendra Prasad", "Pt. Jawaharlal Nehru", "Dr. Sarvepalli Radhakrishnan", "Mahatma Gandhi"],
    correctAnswer: 2,
    timeLimit: 15,
    points: 1000
  },
  {
    question: "What is the motto of the Indian Institutes of Technology (IITs)?",
    options: ["Knowledge is Supreme", "Yoga Karmasu Kaushalam", "Service Before Self", "Truth Alone Triumphs"],
    correctAnswer: 1,
    timeLimit: 25,
    points: 1000
  },
  {
    question: "Which Indian mathematician is known for his work on number theory without formal training?",
    options: ["Aryabhata", "Srinivasa Ramanujan", "Satyendra Nath Bose", "Shakuntala Devi"],
    correctAnswer: 1,
    timeLimit: 20,
    points: 1000
  },
  {
    question: "Who was the first female teacher of India?",
    options: ["Savitribai Phule", "Sarojini Naidu", "Annie Besant", "Rani Lakshmibai"],
    correctAnswer: 0,
    timeLimit: 20,
    points: 1000
  },
  {
    question: "Which university is considered the oldest university in the world, located in ancient India?",
    options: ["Nalanda", "Takshashila", "Vikramashila", "Valabhi"],
    correctAnswer: 1,
    timeLimit: 15,
    points: 1000
  },
  {
    question: "In which year was the Right to Education (RTE) Act enacted in India?",
    options: ["2005", "2007", "2009", "2012"],
    correctAnswer: 2,
    timeLimit: 20,
    points: 1000
  },
  {
    question: "Who wrote the famous book 'Ignited Minds'?",
    options: ["Amartya Sen", "Shashi Tharoor", "Chetan Bhagat", "Dr. A.P.J. Abdul Kalam"],
    correctAnswer: 3,
    timeLimit: 15,
    points: 1000
  },
  {
    question: "Which of the following is NOT a fundamental right related to education in India?",
    options: ["Right to free and compulsory education", "Right of minorities to establish educational institutions", "Right to higher education", "Right to equality in educational opportunities"],
    correctAnswer: 2,
    timeLimit: 30,
    points: 1000
  },
  {
    question: "World Teachers' Day is celebrated on which date?",
    options: ["September 5", "October 5", "November 14", "January 24"],
    correctAnswer: 1,
    timeLimit: 15,
    points: 1000
  }
];

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const quizId = await adminService.createQuiz("Teachers' Day Grand Quiz", "A special quiz for Teachers' Day 2026.");
      
      for (let i = 0; i < sampleQuestions.length; i++) {
        await adminService.addQuestion(quizId, {
          quizId,
          order: i,
          type: 'multiple-choice',
          ...sampleQuestions[i]
        });
      }
      
      alert("Seed successful!");
      navigate(`/admin/quizzes/${quizId}`);
    } catch (e) {
      console.error(e);
      alert("Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-black">
      <h1 className="text-2xl mb-4">Seed Demo Data</h1>
      <button 
        onClick={handleSeed}
        disabled={loading}
        className="bg-[var(--color-accent-gold)] text-black px-6 py-3 rounded font-bold disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Create Sample Quiz (10 Questions)'}
      </button>
    </div>
  );
}
