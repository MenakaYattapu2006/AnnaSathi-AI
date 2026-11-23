import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Top loading progress bar (like YouTube / GitHub) that activates
 * whenever a user changes routes or switches pages across the application.
 */
export const PageProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start progress
    setVisible(true);
    setProgress(25);

    const t1 = setTimeout(() => setProgress(65), 80);
    const t2 = setTimeout(() => setProgress(90), 180);
    const t3 = setTimeout(() => {
      setProgress(100);
      const t4 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(t4);
    }, 280);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px] bg-transparent overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 dark:from-blue-500 dark:via-cyan-400 dark:to-blue-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] dark:shadow-[0_0_12px_rgba(59,130,246,0.7)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
};
