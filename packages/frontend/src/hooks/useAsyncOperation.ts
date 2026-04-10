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
  let loadingToastId: string | null = null;

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

      // Show loading toast
      // Note: Toast component doesn't have IDs yet, so we can't hide it programmatically
      // But we can use duration: 0 to keep it visible
      toast.info(finalLoadingMsg, 0);

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
