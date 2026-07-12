import Modal from '../common/Modal.jsx';
import FeedbackScoreCell from './FeedbackScoreCell.jsx';

const SubScoreRow = ({ label, score }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-700 capitalize">
      {label.replace(/_/g, ' ')}
    </span>
    <FeedbackScoreCell score={typeof score === 'number' ? score : null} />
  </div>
);

const CaseEvaluationDetail = ({ evaluation, onClose }) => {
  if (!evaluation) return null;

  const ruleScores = evaluation.ruleScores || {};
  const llmAttrScores = evaluation.llmAttributeScores || {};
  const hasLlm = evaluation.llmScore !== null && evaluation.llmScore !== undefined;

  return (
    <Modal
      open={!!evaluation}
      onClose={onClose}
      title={`Evaluation — ${evaluation.caseId}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Final score */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Final score</span>
          <FeedbackScoreCell score={evaluation.finalScore} size="lg" />
        </div>

        {/* Justification */}
        {evaluation.justification && (
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed">
            {evaluation.justification}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Layer 1 — Rule-based */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Layer 1 — Rule checks
            </h3>
            <div className="rounded-md border border-gray-200 bg-white px-3">
              {Object.entries(ruleScores).map(([key, val]) => (
                <SubScoreRow key={key} label={key} score={val} />
              ))}
              <SubScoreRow label="overall (avg)" score={evaluation.overallScore} />
            </div>
          </div>

          {/* Layer 2 — LLM attribute scores */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Layer 2 — LLM attribute scores
              {!hasLlm && <span className="ml-2 text-red-500 normal-case">(unavailable)</span>}
            </h3>
            <div className="rounded-md border border-gray-200 bg-white px-3">
              {hasLlm ? (
                <>
                  {Object.entries(llmAttrScores).map(([key, val]) => (
                    <SubScoreRow key={key} label={key} score={val} />
                  ))}
                  <SubScoreRow label="overall" score={evaluation.llmScore} />
                </>
              ) : (
                <p className="py-3 text-sm text-gray-400 italic">LLM judge did not run.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CaseEvaluationDetail;
