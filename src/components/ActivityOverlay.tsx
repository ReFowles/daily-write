'use client';

import { useEffect, useState } from 'react';

export default function ActivityOverlay() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  if (isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 shadow-xl max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Come back to track your progress!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Click here to resume tracking your writing.
        </p>
      </div>
    </div>
  );
}
