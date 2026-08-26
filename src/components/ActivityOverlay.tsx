'use client';

import { useEffect, useState } from 'react';
import { themeClasses } from '@/lib/theme-utils';
import { cn } from '@/lib/class-utils';

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
      <div className={cn('rounded-lg p-8 shadow-xl max-w-md mx-4', themeClasses.background.overlay)}>
        <h2 className={cn('text-2xl font-bold mb-2', themeClasses.text.primary)}>
          Come back to track your progress!
        </h2>
        <p className={themeClasses.text.secondary}>
          Click here to resume tracking your writing.
        </p>
      </div>
    </div>
  );
}
