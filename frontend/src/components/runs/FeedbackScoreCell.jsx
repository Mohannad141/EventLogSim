const scoreConfig = (score) => {
  if (score === null || score === undefined) return { label: '—', className: 'text-gray-400' };
  if (score < 5)    return { label: score.toFixed(1), className: 'bg-red-100 text-red-700 ring-red-200' };
  if (score <= 7.5) return { label: score.toFixed(1), className: 'bg-yellow-100 text-yellow-700 ring-yellow-200' };
  return               { label: score.toFixed(1), className: 'bg-green-100 text-green-700 ring-green-200' };
};

const FeedbackScoreCell = ({ score, size = 'sm' }) => {
  const { label, className } = scoreConfig(score);
  const base = size === 'lg'
    ? 'inline-flex items-center rounded-lg px-3 py-1 text-base font-bold ring-1'
    : 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1';

  if (score === null || score === undefined) {
    return <span className="text-xs text-gray-400 italic">Not evaluated</span>;
  }

  return <span className={`${base} ${className}`}>{label} / 10</span>;
};

export default FeedbackScoreCell;
