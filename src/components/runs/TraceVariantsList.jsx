import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { formatNumber } from '../../utils/format.js';

const MAX_VISIBLE_STEPS = 6;

const renderSequence = (sequence) => {
  if (!sequence?.length) return '—';
  const visible = sequence.slice(0, MAX_VISIBLE_STEPS);
  const truncated = sequence.length > MAX_VISIBLE_STEPS;
  return (
    <span title={sequence.join(' → ')} className="inline-flex flex-wrap items-center gap-1">
      {visible.map((step, i) => (
        <span key={`${step}-${i}`} className="inline-flex items-center gap-1">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800">
            {step}
          </span>
          {i < visible.length - 1 && (
            <ArrowRight className="h-3 w-3 text-gray-400" />
          )}
        </span>
      ))}
      {truncated && (
        <span className="text-xs text-gray-500">
          … +{sequence.length - MAX_VISIBLE_STEPS} more
        </span>
      )}
    </span>
  );
};

const TraceVariantsList = ({
  variants = [],
  maxItems = 5,
  emptyMessage = 'No variants reported.',
  className,
}) => {
  if (!variants.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  const visible = variants.slice(0, maxItems);

  return (
    <ol className={cn('space-y-2', className)}>
      {visible.map((variant, i) => (
        <li
          key={i}
          className="flex items-start justify-between gap-4 rounded-md border border-gray-200 bg-white px-3 py-2"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
              {i + 1}
            </span>
            <div className="min-w-0 text-sm">{renderSequence(variant.sequence)}</div>
          </div>
          <div className="flex-none whitespace-nowrap text-xs text-gray-600">
            {formatNumber(variant.count)} cases
            {typeof variant.percentage === 'number' && (
              <span className="ml-1 text-gray-400">
                ({variant.percentage.toFixed(1)}%)
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default TraceVariantsList;
