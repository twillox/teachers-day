import { useState, useEffect } from 'react';

export function useCountdown(endsAt: number | null | undefined, isPaused: boolean = false) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!endsAt || isPaused) {
      if (!endsAt) setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, endsAt - now);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, [endsAt, isPaused]);

  return timeLeft;
}
