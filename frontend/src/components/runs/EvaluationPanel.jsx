import { useState } from 'react';
import { Loader2, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { useEvaluation } from '../../hooks/useEvaluation.js';
import Button from '../primitives/Button.jsx';
import CaseEvaluationsTable from './CaseEvaluationsTable.jsx';
import AgentScoresChart from './AgentScoresChart.jsx';
import AttributeScoresChart from './AttributeScoresChart.jsx';

const TABS = ['Cases', 'Agents', 'Attributes'];

const EvaluationPanel = ({ runId, events = [] }) => {
  const {
    caseEvals,
    agentScores,
    attributeScores,
    loading,
    running,
    error,
    evaluated,
    triggerEvaluation,
    refresh,
  } = useEvaluation(runId);

  const [activeTab, setActiveTab] = useState('Cases');

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Feedback Evaluation</h2>
          {evaluated && !running && (
            <button
              onClick={refresh}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={() => triggerEvaluation()}
          disabled={running}
          variant={evaluated ? 'secondary' : 'primary'}
          size="sm"
        >
          {running ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Evaluating…
            </>
          ) : (
            <>
              <Play className="mr-1.5 h-4 w-4" />
              {evaluated ? 'Re-run Evaluation' : 'Run Evaluation'}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
          {error.message || 'Evaluation failed.'}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading evaluation data…
        </div>
      )}

      {/* Not yet evaluated */}
      {!loading && !evaluated && !running && (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm text-gray-500">
          <p>This run has not been evaluated yet.</p>
          <p className="mt-1 text-xs">Click "Run Evaluation" to score each case using rule checks and an LLM judge.</p>
        </div>
      )}

      {/* Tabs + content */}
      {!loading && evaluated && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-sky-600 text-sky-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Cases' && (
            <CaseEvaluationsTable events={events} caseEvals={caseEvals} />
          )}

          {activeTab === 'Agents' && (
            <div>
              <p className="mb-3 text-xs text-gray-500">
                Average final score per agent across all evaluated cases they participated in.
              </p>
              <AgentScoresChart agents={agentScores} />
            </div>
          )}

          {activeTab === 'Attributes' && (
            <div>
              <p className="mb-3 text-xs text-gray-500">
                Average LLM plausibility score per attribute across all evaluated cases.
              </p>
              <AttributeScoresChart attributes={attributeScores} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationPanel;
