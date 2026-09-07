import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import type { Response } from '../types';

export function useResponses(gameCode: string | undefined, attemptId: string | undefined) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameCode || !attemptId) {
      setResponses([]);
      setLoading(false);
      return;
    }

    const responsesRef = ref(rtdb, `live_sessions/${gameCode}/responses/${attemptId}`);
    
    const unsubscribe = onValue(responsesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setResponses(Object.values(data) as Response[]);
      } else {
        setResponses([]);
      }
      setLoading(false);
    });

    return () => off(responsesRef, 'value', unsubscribe);
  }, [gameCode, attemptId]);

  return { responses, loading };
}
