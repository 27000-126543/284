import { useEffect, useCallback } from 'react';

export const useRefresh = (callback: () => void, interval = 5000, enabled = true) => {
  const refresh = useCallback(() => {
    callback();
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [refresh, interval, enabled]);

  return { refresh };
};
