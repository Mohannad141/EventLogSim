import { useCallback, useEffect, useRef, useState } from 'react';
import { getRun } from '../lib/api.js';

export const useRunDetail = (id) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequestRef = useRef(null);

  const fetchRun = useCallback(async () => {
    if (!id) {
      setRun(null);
      return;
    }
    // De-dupe concurrent requests for the same id (React strict mode
    // mounts effects twice in dev, which would otherwise trigger the
    // backend's expensive lazy LLM generation a second time).
    const requestId = Symbol('runDetail');
    activeRequestRef.current = requestId;

    setLoading(true);
    setError(null);
    try {
      const data = await getRun(id);
      if (activeRequestRef.current !== requestId) return;
      setRun(data);
    } catch (err) {
      if (activeRequestRef.current !== requestId) return;
      setError(err);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchRun();
    return () => {
      // Cancel any in-flight request when the effect re-runs or unmounts.
      activeRequestRef.current = null;
    };
  }, [fetchRun]);

  return { run, loading, error, refresh: fetchRun };
};
