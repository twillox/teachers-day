import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import type { Participant } from '../types';

export function useParticipants(gameCode: string | undefined) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameCode) {
      setLoading(false);
      return;
    }

    const participantsRef = ref(rtdb, `live_sessions/${gameCode}/participants`);
    
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pArray = Object.values(data) as Participant[];
        // Sort by score descending, then cumulativeResponseTime ascending
        pArray.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.cumulativeResponseTime - b.cumulativeResponseTime;
        });
        
        // Assign ranks
        pArray.forEach((p, index) => {
          p.rank = index + 1;
        });
        
        setParticipants(pArray);
      } else {
        setParticipants([]);
      }
      setLoading(false);
    });

    return () => off(participantsRef, 'value', unsubscribe);
  }, [gameCode]);

  return { participants, loading };
}
