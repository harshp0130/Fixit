import { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';

export const useAuthCheck = () => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await userService.validateToken();
      if (!valid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsValid(false);
      }
    };

    // Check immediately
    checkAuth();

    // Then check every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return isValid;
};

export const usePolling = <T>(
  fetchFunction: () => Promise<T>,
  interval: number = 30000,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const savedCallback = useRef(fetchFunction);

  useEffect(() => {
    savedCallback.current = fetchFunction;
  }, [fetchFunction]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await savedCallback.current();
        setData(result);
        setError(null);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    const pollInterval = setInterval(fetchData, interval);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [interval, ...dependencies]);

  return { data, error, isLoading };
};
