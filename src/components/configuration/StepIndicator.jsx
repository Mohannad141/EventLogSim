import { Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const StepIndicator = ({ steps, currentIndex, completion, onSelect }) => {
  return (
    <ol className="flex items-center gap-0">
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
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ring-2 transition-colors',
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-indigo-600'
                    : isComplete
                      ? 'bg-green-600 text-white ring-green-600'
                      : 'bg-white text-gray-500 ring-gray-300 group-hover:ring-gray-400'
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
                    ? 'font-semibold text-gray-900'
                    : isComplete
                      ? 'font-medium text-gray-700'
                      : 'text-gray-500 group-hover:text-gray-700'
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast && (
              <span
                className={cn(
                  'mx-3 h-px flex-1',
                  isComplete ? 'bg-green-300' : 'bg-gray-200'
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
