import { useNavigate } from 'react-router-dom';
import Card from '../primitives/Card.jsx';
import Badge from '../primitives/Badge.jsx';
import { cn } from '../../utils/cn.js';
import { formatNumber, formatRelativeTime } from '../../utils/format.js';

const STATUS_VARIANT = {
  completed: 'success',
  running: 'warning',
  failed: 'danger',
};

const RunCard = ({
  run,
  selected = false,
  selectable = true,
  onSelectChange,
}) => {
  const navigate = useNavigate();
  const variant = STATUS_VARIANT[run.status] || 'neutral';
  const stats = run.stats || {};

  const handleCardClick = () => {
    navigate(`/runs/${run.id}`);
  };

  const handleCheckbox = (e) => {
    e.stopPropagation();
    onSelectChange?.(e.target.checked);
  };

  const checkboxDisabled = !selectable && !selected;

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'cursor-pointer p-4 transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-indigo-500'
      )}
    >
      <div className="flex items-start gap-3">
        <label
          className="flex h-6 items-center pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={checkboxDisabled}
            onChange={handleCheckbox}
            aria-label={`Select run ${run.id}`}
            title={
              checkboxDisabled
                ? 'Maximum 4 runs can be compared'
                : undefined
            }
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {run.configName || (
                  <span className="italic text-gray-400">Untitled run</span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-xs text-gray-500">
                {run.id}
              </div>
            </div>
            <Badge variant={variant}>{run.status || 'unknown'}</Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {run.createdAt
                ? formatRelativeTime(run.createdAt)
                : 'time unknown'}
            </span>
            <div className="flex items-center gap-3">
              <span>
                <strong className="font-semibold text-gray-900">
                  {formatNumber(stats.caseCount) || '—'}
                </strong>{' '}
                cases
              </span>
              <span>
                <strong className="font-semibold text-gray-900">
                  {formatNumber(stats.eventCount) || '—'}
                </strong>{' '}
                events
              </span>
              <span>
                <strong className="font-semibold text-gray-900">
                  {formatNumber(stats.variantCount) || '—'}
                </strong>{' '}
                variants
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RunCard;
