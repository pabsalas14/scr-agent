import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface AsyncOperationOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  autoHideSuccess?: boolean;
  autoHideDuration?: number;
}

export function useAsyncOperation(options: AsyncOperationOptions = {}) {
  const {
    loadingMessage = 'Procesando...',
    successMessage = 'Operación completada exitosamente',
    errorMessage = 'Error en la operación',
    onSuccess,
    onError,
    autoHideSuccess = true,
    autoHideDuration = 3000,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      customMessages?: {
        loading?: string;
        success?: string;
        error?: string;
      }
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      const finalLoadingMsg = customMessages?.loading || loadingMessage;
      const finalSuccessMsg = customMessages?.success || successMessage;
      const finalErrorMsg = customMessages?.error || errorMessage;

      // Show loading toast with reasonable duration so it auto-closes
      // BUG FIX #14: Use duration of 10s instead of 0 (infinite), with finally block for cleanup
      toast.info(finalLoadingMsg, 10000);

      try {
        const result = await operation();
        setIsLoading(false);

        // Show success toast
        toast.success(finalSuccessMsg, autoHideSuccess ? autoHideDuration : 0);
        onSuccess?.();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);

        // Show error toast
        toast.error(finalErrorMsg, autoHideSuccess ? autoHideDuration : 0);
        onError?.(error);

        throw error;
      } finally {
        // BUG FIX #14: Ensure loading state is cleared even if operation hangs
        setIsLoading(false);
      }
    },
    [loadingMessage, successMessage, errorMessage, onSuccess, onError, autoHideSuccess, autoHideDuration, toast]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}
