import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const StepIndicator = ({ steps, currentIndex, completion, onSelect }) => {
  return (
    <ol className="flex items-center gap-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = !!completion?.[step.key];
        const isLast = index === steps.length - 1;

        return (
          <li key={step.key} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onSelect?.(index)}
              className="group flex items-center gap-2 text-left"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-2 transition-colors',
                  isCurrent
                    ? 'bg-sky-500 text-white ring-sky-200 shadow-sm'
                    : isComplete
                      ? 'bg-sky-100 text-sky-700 ring-sky-200'
                      : 'bg-white text-slate-500 ring-slate-200 group-hover:ring-sky-200'
                )}
              >
                {isComplete && !isCurrent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  'text-sm transition-colors',
                  isCurrent
                    ? 'font-semibold text-slate-950'
                    : isComplete
                      ? 'font-medium text-sky-700'
                      : 'text-slate-500 group-hover:text-sky-700'
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast && (
              <span
                className={cn(
                  'mx-3 h-px flex-1',
                  isComplete ? 'bg-sky-200' : 'bg-slate-200'
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default StepIndicator;
