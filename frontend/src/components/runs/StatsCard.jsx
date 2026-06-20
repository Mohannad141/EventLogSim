import { cn } from '../../utils/cn.js';
import { formatNumber, formatDuration } from '../../utils/format.js';

const Stat = ({ label, value, compact }) => (
  <div className="flex flex-col">
    <span
      className={cn(
        'text-xs font-medium uppercase tracking-wide text-gray-500',
        compact && 'text-[10px]'
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        'mt-1 font-semibold text-gray-900',
        compact ? 'text-lg' : 'text-2xl'
      )}
    >
      {value}
    </span>
  </div>
);

const StatsCard = ({ stats = {}, compact = false, className }) => {
  const cells = [
    { label: 'Cases', value: formatNumber(stats.caseCount) || '—' },
    { label: 'Events', value: formatNumber(stats.eventCount) || '—' },
    { label: 'Variants', value: formatNumber(stats.variantCount) || '—' },
    {
  label: 'Duration',
  value: stats.duration || '—',
},
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-4',
        compact ? 'gap-3' : 'gap-6',
        className
      )}
    >
      {cells.map((c) => (
        <Stat key={c.label} {...c} compact={compact} />
      ))}
    </div>
  );
};

export default StatsCard;
