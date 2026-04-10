import { useState, useCallback, useEffect, useRef } from 'react';

interface UsePaginatedQueryProps<T> {
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  enabled?: boolean;
}

interface UsePaginatedQueryResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePaginatedQuery<T>({
  queryFn,
  pageSize = 20,
  enabled = true,
}: UsePaginatedQueryProps<T>): UsePaginatedQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const cacheRef = useRef<Map<number, T[]>>(new Map());
  // BUG FIX #15: Track in-flight requests to prevent race conditions
  const inflightRef = useRef<Map<number, Promise<{ data: T[]; total: number }>>>(new Map());

  const totalPages = Math.ceil(totalItems / pageSize);

  const loadPage = useCallback(
    async (page: number) => {
      if (!enabled) return;

      // Check cache first (for already-completed requests)
      if (cacheRef.current.has(page)) {
        setData(cacheRef.current.get(page)!);
        setCurrentPage(page);
        return;
      }

      // BUG FIX #15: Return cached promise if request already in flight
      if (inflightRef.current.has(page)) {
        try {
          const result = await inflightRef.current.get(page)!;
          setData(result.data);
          setTotalItems(result.total);
          setCurrentPage(page);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create the promise for this request
      const requestPromise = queryFn(page, pageSize);
      inflightRef.current.set(page, requestPromise);

      try {
        const result = await requestPromise;
        setData(result.data);
        setTotalItems(result.total);
        cacheRef.current.set(page, result.data);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        // Clean up the in-flight promise
        inflightRef.current.delete(page);
      }
    },
    [queryFn, pageSize, enabled]
  );

  useEffect(() => {
    loadPage(1);
  }, []);

  const goToPage = useCallback(
    async (page: number) => {
      if (page < 1 || page > totalPages) return;
      await loadPage(page);
    },
    [loadPage, totalPages]
  );

  const nextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const refetch = useCallback(async () => {
    cacheRef.current.clear();
    await loadPage(1);
  }, [loadPage]);

  return {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  };
}
