import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import type { LiveSessionState } from '../types';

export function useLiveSession(gameCode: string | undefined) {
  const [session, setSession] = useState<LiveSessionState & { currentAttemptId?: string, isPaused?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameCode) {
      setLoading(false);
      return;
    }

    const sessionRef = ref(rtdb, `live_sessions/${gameCode}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSession(snapshot.val());
      } else {
        setSession(null);
        setError(new Error('Session not found'));
      }
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => off(sessionRef, 'value', unsubscribe);
  }, [gameCode]);

  return { session, loading, error };
}
