import { useContext } from 'react';
import { RunsContext } from './RunsContext.js';

export const useRuns = () => {
  const ctx = useContext(RunsContext);
  if (!ctx) {
    throw new Error('useRuns must be used inside a RunsProvider');
  }
  return ctx;
};
