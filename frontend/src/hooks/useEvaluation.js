import { useState, useCallback, useEffect } from 'react';
import {
  getCaseEvaluations,
  getAgentScores,
  getAttributeScores,
  runEvaluation,
} from '../lib/api.js';

export function useEvaluation(runId) {
  const [caseEvals, setCaseEvals] = useState([]);
  const [agentScores, setAgentScores] = useState([]);
  const [attributeScores, setAttributeScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    setError(null);
    try {
      const [evals, agents, attributes] = await Promise.all([
        getCaseEvaluations(runId),
        getAgentScores(runId),
        getAttributeScores(runId),
      ]);
      setCaseEvals(evals);
      setAgentScores(agents);
      setAttributeScores(attributes);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triggerEvaluation = useCallback(async (opts = {}) => {
    setRunning(true);
    setError(null);
    try {
      await runEvaluation(runId, opts);
      await fetchAll();
    } catch (e) {
      setError(e);
    } finally {
      setRunning(false);
    }
  }, [runId, fetchAll]);

  const evaluated = caseEvals.length > 0;

  return {
    caseEvals,
    agentScores,
    attributeScores,
    loading,
    running,
    error,
    evaluated,
    triggerEvaluation,
    refresh: fetchAll,
  };
}
