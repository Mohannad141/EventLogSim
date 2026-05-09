import { useCallback, useEffect, useState } from 'react';
import { getRun } from '../lib/api.js';

export const useRunDetail = (id) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRun = useCallback(async () => {
    if (!id) {
      setRun(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRun(id);
      setRun(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  return { run, loading, error, refresh: fetchRun };
};
