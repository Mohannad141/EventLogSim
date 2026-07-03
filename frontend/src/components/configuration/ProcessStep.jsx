import { useRef, useState } from 'react';
import { Upload, FileText, X, RotateCcw } from 'lucide-react';
import Textarea from '../primitives/Textarea.jsx';
import Button from '../primitives/Button.jsx';
import Input from '../primitives/Input.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { cn } from '../../utils/cn.js';
import { formatNumber } from '../../utils/format.js';
import { validateProcess } from '../../lib/validation.js';

const MODES = [
  {
    value: 'PURE_LLM',
    title: 'Text-based',
    description:
      'Describe the process in plain text; agents coordinate freely via the LLM.',
  },
  {
    value: 'BPMN_BASED',
    title: 'BPMN-based',
    description:
      'Upload a .bpmn file to constrain the simulation by its transitions.',
  },
];

const ACCEPTED_EXT = ['.bpmn', '.xml'];

const ProcessStep = ({
  process,
  onChangeMode,
  onChangeDescription,
  onChangeBpmnFile,
  onChangeRunName,
  onResetStep,
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { errors } = validateProcess(process);

  const readFile = (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ACCEPTED_EXT.includes(ext)) {
      window.alert(`Unsupported file type. Please upload ${ACCEPTED_EXT.join(' or ')}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChangeBpmnFile({
        name: file.name,
        size: file.size,
        content: typeof reader.result === 'string' ? reader.result : '',
      });
    };
    reader.readAsText(file);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    readFile(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    readFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Process
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose how agents coordinate and describe the process they will
            simulate.
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
          htmlFor="run-name"
          className="block text-sm font-medium text-gray-900"
        >
          Run Name <span className="text-red-600">*</span>
        </label>
        <Input
          id="run-name"
          value={process.runName || ''}
          onChange={(e) => onChangeRunName(e.target.value)}
          placeholder="e.g. IT process, Payment process, or test 101"
          className="mt-1"
        />
        {errors.runName && (
          <p className="mt-1 text-xs text-red-600">{errors.runName}</p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">
          Coordination mode
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => {
            const selected = process.mode === m.value;
            return (
              <label
                key={m.value}
                className={cn(
                  'flex cursor-pointer flex-col rounded-2xl border p-5 transition-all duration-200',
                  selected
                    ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm'
                )}
              >
                <input
                  type="radio"
                  name="processMode"
                  value={m.value}
                  checked={selected}
                  onChange={() => onChangeMode(m.value)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-gray-900">
                  {m.title}
                </span>
                <span className="mt-1 text-xs text-gray-600">
                  {m.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {process.mode === 'PURE_LLM' && (
        <div>
          <label
            htmlFor="process-description"
            className="block text-sm font-medium text-gray-900"
          >
            Process description
          </label>
          <Textarea
            id="process-description"
            rows={6}
            value={process.description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Describe the process in plain English. What is the goal? Who participates? What activities happen and in what order?"
            className="mt-2 rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>
      )}

      {process.mode === 'BPMN_BASED' && (
        <div>
          <label className="block text-sm font-medium text-gray-900">
            BPMN file
          </label>
          {process.bpmnFile ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-sky-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {process.bpmnFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(process.bpmnFile.size)} bytes
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChangeBpmnFile(null)}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors',
                dragOver
                  ? 'border-sky-400 bg-sky-50'
                  : 'border-slate-300 bg-sky-50/40'
              )}
            >
              <Upload className="mb-2 h-6 w-6 text-gray-400" />
              <p className="text-sm text-gray-700">
                Drag a BPMN file here, or
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXT.join(',')}
                onChange={onPick}
                className="hidden"
              />
              <p className="mt-2 text-xs text-gray-500">
                Accepts .bpmn or .xml
              </p>
            </div>
          )}
          {errors.bpmnFile && (
            <p className="mt-1 text-xs text-red-600">{errors.bpmnFile}</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Process step?"
        message="This will clear the mode selection, description, and BPMN file."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={onResetStep}
      />
    </div>
  );
};

export default ProcessStep;
