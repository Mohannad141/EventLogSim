import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import FeedbackScoreCell from './FeedbackScoreCell.jsx';
import CaseEvaluationDetail from './CaseEvaluationDetail.jsx';

const CaseEvaluationsTable = ({ events = [], caseEvals = [] }) => {
  const [selectedEval, setSelectedEval] = useState(null);

  const evalByCase = useMemo(() => {
    const map = {};
    for (const e of caseEvals) map[e.caseId] = e;
    return map;
  }, [caseEvals]);

  const cases = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const id = ev.caseId;
      if (!id) continue;
      if (!map[id]) map[id] = { caseId: id, eventCount: 0 };
      map[id].eventCount++;
    }
    return Object.values(map).sort((a, b) => a.caseId.localeCompare(b.caseId));
  }, [events]);

  if (cases.length === 0) {
    return <p className="text-sm text-gray-500">No cases to display.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Case ID', 'Events', 'Final Score', 'Rule Score', 'LLM Score', ''].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {cases.map((c) => {
              const ev = evalByCase[c.caseId];
              return (
                <tr key={c.caseId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-700">
                    {c.caseId}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                    {c.eventCount}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <FeedbackScoreCell score={ev?.finalScore} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <FeedbackScoreCell score={ev?.overallScore} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <FeedbackScoreCell score={ev?.llmScore ?? null} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {ev ? (
                      <button
                        onClick={() => setSelectedEval(ev)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Detail
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CaseEvaluationDetail
        evaluation={selectedEval}
        onClose={() => setSelectedEval(null)}
      />
    </>
  );
};

export default CaseEvaluationsTable;
