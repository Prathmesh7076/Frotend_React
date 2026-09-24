"use client";

import { useCallback, useRef } from "react";

export function useLatestAsync<T extends (...args: never[]) => Promise<unknown>>(
  fn: T
) {
  const requestIdRef = useRef(0);

  return useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      const currentRequestId = ++requestIdRef.current;
      try {
        const result = (await fn(...args)) as ReturnType<T>;
        if (currentRequestId !== requestIdRef.current) {
          return null;
        }
        return result;
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return null;
        }
        throw error;
      }
    },
    [fn]
  );
}
