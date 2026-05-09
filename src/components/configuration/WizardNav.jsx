import { ChevronLeft, ChevronRight, Play, Loader2 } from 'lucide-react';
import Button from '../primitives/Button.jsx';

const WizardNav = ({
  currentIndex,
  canGoNext,
  nextDisabledReason,
  onBack,
  onNext,
  isLastStep,
  canRun,
  submitting = false,
  runDisabledReason,
  onRun,
}) => {
  const showBack = currentIndex > 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {showBack ? (
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
      </div>
      <div className="flex items-center gap-3">
        {isLastStep ? (
          <>
            {!canRun && runDisabledReason && (
              <span className="text-xs text-gray-500">
                {runDisabledReason}
              </span>
            )}
            <Button
              size="lg"
              disabled={!canRun}
              onClick={onRun}
              title={canRun ? undefined : runDisabledReason}
            >
              {submitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-4 w-4" />
              )}
              {submitting ? 'Running…' : 'Run Simulation'}
            </Button>
          </>
        ) : (
          <>
            {!canGoNext && nextDisabledReason && (
              <span className="text-xs text-gray-500">
                {nextDisabledReason}
              </span>
            )}
            <Button
              disabled={!canGoNext}
              onClick={onNext}
              title={canGoNext ? undefined : nextDisabledReason}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default WizardNav;
