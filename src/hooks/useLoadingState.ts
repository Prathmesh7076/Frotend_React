"use client";

import { useState, useCallback, useRef } from "react";

export function useLoadingState<
  T extends (...args: never[]) => Promise<unknown>
>(fn: T) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      if (submittedRef.current) return null;
      submittedRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const result = (await fn(...args)) as ReturnType<T>;
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        submittedRef.current = false;
      }
    },
    [fn]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, reset };
}
