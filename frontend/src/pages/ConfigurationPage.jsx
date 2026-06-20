import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, X, AlertCircle } from 'lucide-react';
import Card from '../components/primitives/Card.jsx';
import Button from '../components/primitives/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StepIndicator from '../components/configuration/StepIndicator.jsx';
import WizardNav from '../components/configuration/WizardNav.jsx';
import ProcessStep from '../components/configuration/ProcessStep.jsx';
import AgentsStep from '../components/configuration/AgentsStep.jsx';
import AttributesStep from '../components/configuration/AttributesStep.jsx';
import SimulationStep from '../components/configuration/SimulationStep.jsx';
import { useConfigState } from '../hooks/useConfigState.js';
import { useRuns } from '../hooks/useRuns.jsx';
import { validateAll } from '../lib/validation.js';
import { createRun } from '../lib/api.js';

const STEPS = [
  { key: 'process', label: 'Process' },
  { key: 'agents', label: 'Agents' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'simulation', label: 'Simulation' },
];

const stepReason = (step) => {
  switch (step.key) {
    case 'process':
      return 'Complete the Process step first.';
    case 'agents':
      return 'Add at least one valid agent.';
    case 'attributes':
      return 'Fix the Attributes step first.';
    case 'simulation':
      return 'Set a valid case count.';
    default:
      return 'Fix earlier step first.';
  }
};

const deriveConfigName = (config) => {
  const desc = (config?.process?.description || '').trim();
  if (desc) return desc.length > 30 ? `${desc.slice(0, 30)}…` : desc;
  return 'Untitled run';
};

const ConfigurationPage = () => {
  const {
    config,
    setProcessMode,
    setProcessDescription,
    setBpmnFile,
    addAgent,
    updateAgent,
    removeAgent,
    addAttribute,
    updateAttribute,
    removeAttribute,
    setCaseCount,
    resetStep,
    resetAll,
  } = useConfigState();

  const { addRunOptimistic, refresh } = useRuns();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { perStep, valid: allValid } = validateAll(config);
  const completion = {
    process: perStep.process.valid,
    agents: perStep.agents.valid,
    attributes: perStep.attributes.valid,
    simulation: perStep.simulation.valid,
  };

  const currentStep = STEPS[currentIndex];
  const currentValid = perStep[currentStep.key].valid;
  const isLastStep = currentIndex === STEPS.length - 1;

  const firstInvalid = STEPS.find((s) => !perStep[s.key].valid);
  const validityReason = allValid
    ? null
    : firstInvalid
      ? `Cannot run: ${firstInvalid.label} step is incomplete.`
      : 'Cannot run yet.';
  const runDisabledReason = submitting
    ? 'Submitting…'
    : validityReason;

  const nextDisabledReason = currentValid ? null : stepReason(currentStep);

  const goNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRun = async () => {
    if (submitting) return;
    if (!validateAll(config).valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createRun(config);
      addRunOptimistic({
        id: created.id,
        configName: deriveConfigName(config),
        status: created.status || 'completed',
        createdAt: created.createdAt || new Date().toISOString(),
        duration: null,
        stats: null,
      });
      refresh();
      navigate(`/runs/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to start the simulation.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep.key) {
      case 'process':
        return (
          <ProcessStep
            process={config.process}
            onChangeMode={setProcessMode}
            onChangeDescription={setProcessDescription}
            onChangeBpmnFile={setBpmnFile}
            onResetStep={() => resetStep('process')}
          />
        );
      case 'agents':
        return (
          <AgentsStep
            agents={config.agents}
            onAdd={addAgent}
            onUpdate={updateAgent}
            onRemove={removeAgent}
            onResetStep={() => resetStep('agents')}
          />
        );
      case 'attributes':
        return (
          <AttributesStep
            attributes={config.attributes}
            onAdd={addAttribute}
            onUpdate={updateAttribute}
            onRemove={removeAttribute}
            onResetStep={() => resetStep('attributes')}
          />
        );
      case 'simulation':
        return (
          <SimulationStep
            simulation={config.simulation}
            canRun={allValid && !submitting}
            submitting={submitting}
            runDisabledReason={runDisabledReason}
            onChangeCaseCount={setCaseCount}
            onResetStep={() => resetStep('simulation')}
            onRun={handleRun}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Set up agents, the process, attributes, and the simulation.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmResetAll(true)}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset all
        </Button>
      </div>

      <StepIndicator
        steps={STEPS}
        currentIndex={currentIndex}
        completion={completion}
        onSelect={setCurrentIndex}
      />

      <Card>{renderStep()}</Card>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-red-600" />
            <div>
              <div className="font-semibold">Could not start the simulation.</div>
              <div className="mt-0.5 text-red-800">{error}</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setError(null)}
            className="rounded-md p-1 text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <WizardNav
        currentIndex={currentIndex}
        canGoNext={currentValid}
        nextDisabledReason={nextDisabledReason}
        onBack={goBack}
        onNext={goNext}
        isLastStep={isLastStep}
        canRun={allValid && !submitting}
        submitting={submitting}
        runDisabledReason={runDisabledReason}
        onRun={handleRun}
      />

      <ConfirmDialog
        open={confirmResetAll}
        onClose={() => setConfirmResetAll(false)}
        title="Reset entire configuration?"
        message="This will clear all values across every step. This cannot be undone."
        confirmLabel="Reset all"
        variant="danger"
        onConfirm={() => {
          resetAll();
          setCurrentIndex(0);
        }}
      />
    </div>
  );
};

export default ConfigurationPage;
