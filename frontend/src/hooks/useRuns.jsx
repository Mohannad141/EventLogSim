import { useCallback, useEffect, useState, useContext } from 'react';
import { RunsContext } from './RunsContext.js';
import { listRuns } from '../lib/api.js';

const sortByCreatedDesc = (runs) =>
  [...runs].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

export const useRuns = () => {
  const ctx = useContext(RunsContext);
  if (!ctx) {
    throw new Error('useRuns must be used inside a RunsProvider');
  }
  return ctx;
};

export const RunsProvider = ({ children }) => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRuns();
      setRuns(sortByCreatedDesc(data));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRunOptimistic = useCallback((summary) => {
    if (!summary?.id) return;
    setRuns((prev) => {
      if (prev.some((r) => r.id === summary.id)) return prev;
      return sortByCreatedDesc([summary, ...prev]);
    });
  }, []);

  const value = { runs, loading, error, refresh, addRunOptimistic };

  return (
    <RunsContext.Provider value={value}>{children}</RunsContext.Provider>
  );
};

export default RunsProvider;
