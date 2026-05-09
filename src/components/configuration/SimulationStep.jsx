import { useState } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import Input from '../primitives/Input.jsx';
import Button from '../primitives/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { validateSimulation } from '../../lib/validation.js';

const MIN_CASES = 1;
const MAX_CASES = 10000;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const SimulationStep = ({
  simulation,
  canRun,
  submitting = false,
  runDisabledReason,
  onChangeCaseCount,
  onChangeSeed,
  onResetStep,
  onRun,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const { errors } = validateSimulation(simulation);

  const handleCaseCountChange = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      onChangeCaseCount(0);
      return;
    }
    onChangeCaseCount(clamp(Math.round(n), MIN_CASES, MAX_CASES));
  };

  const handleSeedChange = (raw) => {
    if (raw === '' || raw === null || raw === undefined) {
      onChangeSeed(null);
      return;
    }
    const n = Number(raw);
    onChangeSeed(Number.isFinite(n) ? n : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Simulation</h2>
          <p className="mt-1 text-sm text-gray-600">
            Set how many cases to generate and (optionally) a seed for
            reproducibility.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset step
        </Button>
      </div>

      <div>
        <label
          htmlFor="case-count"
          className="block text-sm font-medium text-gray-900"
        >
          Number of cases
        </label>
        <div className="mt-2 flex items-center gap-4">
          <Input
            id="case-count"
            type="number"
            value={String(simulation.caseCount ?? '')}
            onChange={(e) => handleCaseCountChange(e.target.value)}
            className="w-32"
          />
          <input
            type="range"
            min={MIN_CASES}
            max={MAX_CASES}
            step={1}
            value={clamp(
              Number(simulation.caseCount) || MIN_CASES,
              MIN_CASES,
              MAX_CASES
            )}
            onChange={(e) => handleCaseCountChange(e.target.value)}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-16 text-right text-xs text-gray-500">
            {MIN_CASES}–{MAX_CASES}
          </span>
        </div>
        {errors.caseCount && (
          <p className="mt-1 text-xs text-red-600">{errors.caseCount}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="seed"
          className="block text-sm font-medium text-gray-900"
        >
          Random seed
        </label>
        <Input
          id="seed"
          type="number"
          value={simulation.seed === null ? '' : String(simulation.seed)}
          onChange={(e) => handleSeedChange(e.target.value)}
          placeholder="e.g. 42 (optional)"
          className="mt-2 w-48"
        />
        <p className="mt-1 text-xs text-gray-500">
          When set, makes runs reproducible.
        </p>
        {errors.seed && (
          <p className="mt-1 text-xs text-red-600">{errors.seed}</p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Button
          size="lg"
          onClick={onRun}
          disabled={!canRun}
          title={canRun ? undefined : runDisabledReason}
        >
          {submitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-1.5 h-4 w-4" />
          )}
          {submitting ? 'Running…' : 'Run Simulation'}
        </Button>
      </div>
      {!canRun && runDisabledReason && (
        <p className="text-right text-xs text-gray-500">
          {runDisabledReason}
        </p>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Simulation step?"
        message="This will reset the case count to 100 and clear the seed."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={onResetStep}
      />
    </div>
  );
};

export default SimulationStep;
