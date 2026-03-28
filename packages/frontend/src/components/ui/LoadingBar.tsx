import { useEffect, useState } from 'react';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setProgress(10);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 25;
        });
      }, 150);
      return () => clearInterval(interval);
    };

    const handleEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    };

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleEnd);

    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      handleStart();
      return originalFetch.apply(this, args).finally(() => {
        setTimeout(handleEnd, 600);
      });
    };

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleEnd);
      window.fetch = originalFetch;
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed top-0 left-0 h-1.5 z-[9999] transition-all duration-200"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(to right, #06b6d4, #0ea5e9, #6366f1, #ec4899, #f43f5e)',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(168, 85, 247, 0.6)',
      }}
    />
  );
}
