import { useEffect, useState } from 'react';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Detectar cambios en el documento
    const handleStart = () => {
      setIsLoading(true);
      setProgress(10);
    };

    const handleEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    };

    // Escuchar eventos de navegación
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleEnd);

    // Observer para detectar cambios en XHR/Fetch
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      handleStart();
      return originalFetch.apply(this, args).finally(() => {
        // Simuler progreso gradual
        setTimeout(handleEnd, 500);
      });
    };

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleEnd);
      window.fetch = originalFetch;
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 origin-left transition-all duration-300 ease-out z-[9999]"
      style={{
        transform: `scaleX(${progress / 100})`,
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
