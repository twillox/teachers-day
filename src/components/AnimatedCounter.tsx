import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({ from, to, duration = 1.5, delay = 0, className = '' }: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasStarted(true);
      animate(count, to, { duration, ease: "easeOut" });
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [from, to, duration, delay, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
