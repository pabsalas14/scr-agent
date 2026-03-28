import { useEffect, useState } from 'react';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Detectar cambios en el documento
    const handleStart = () => {
      setIsLoading(true);
      setProgress(10);
      // Incremento gradual de progreso
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 30;
        });
      }, 200);
      return () => clearInterval(interval);
    };

    const handleEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 600);
    };

    // Escuchar eventos de navegación
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleEnd);

    // Observer para detectar cambios en XHR/Fetch
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      handleStart();
      return originalFetch.apply(this, args).finally(() => {
        setTimeout(handleEnd, 800);
      });
    };

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleEnd);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {/* Barra superior brillante con gradiente */}
      <div
        className="fixed top-0 left-0 w-full z-[9999] transition-all duration-300"
        style={{
          height: isLoading ? '3px' : '0px',
          opacity: isLoading ? 1 : 0,
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-blue-500/50"
          style={{
            width: `${progress}%`,
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>

      {/* Brillo adicional detrás */}
      {isLoading && (
        <div
          className="fixed top-0 left-0 h-1 z-[9998] blur-md bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
          style={{
            width: `${progress}%`,
            opacity: 0.5,
            transition: 'width 0.3s ease-out',
          }}
        />
      )}
    </>
  );
}
