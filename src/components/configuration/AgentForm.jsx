import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../primitives/Button.jsx';
import Input from '../primitives/Input.jsx';
import Textarea from '../primitives/Textarea.jsx';
import ChipInput from './ChipInput.jsx';

const emptyAgent = {
  name: '',
  role: '',
  age: '',
  description: '',
  actions: [],
};

const AgentForm = ({ open, agent, onClose, onSave }) => {
  const [draft, setDraft] = useState(emptyAgent);

  useEffect(() => {
    if (open) {
      setDraft(
        agent
          ? {
              ...emptyAgent,
              ...agent,
              age: agent.age == null ? '' : String(agent.age),
            }
          : emptyAgent
      );
    }
  }, [open, agent]);

  const set = (field) => (eOrValue) => {
    const value =
      eOrValue && typeof eOrValue === 'object' && 'target' in eOrValue
        ? eOrValue.target.value
        : eOrValue;
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const isValid =
    draft.name.trim() !== '' &&
    draft.role.trim() !== '' &&
    draft.actions.length > 0;

  const handleSave = () => {
    if (!isValid) return;
    const ageNum = draft.age === '' ? null : Number(draft.age);
    onSave({
      ...draft,
      name: draft.name.trim(),
      role: draft.role.trim(),
      description: draft.description.trim(),
      age:
        ageNum === null || Number.isNaN(ageNum) || !Number.isFinite(ageNum)
          ? null
          : ageNum,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={agent ? 'Edit agent' : 'Add agent'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!isValid} onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label
            htmlFor="agent-name"
            className="block text-sm font-medium text-gray-900"
          >
            Name <span className="text-red-600">*</span>
          </label>
          <Input
            id="agent-name"
            value={draft.name}
            onChange={set('name')}
            placeholder="e.g. Maria Schmidt"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-1">
          <label
            htmlFor="agent-role"
            className="block text-sm font-medium text-gray-900"
          >
            Role <span className="text-red-600">*</span>
          </label>
          <Input
            id="agent-role"
            value={draft.role}
            onChange={set('role')}
            placeholder="e.g. Supervisor"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-1">
          <label
            htmlFor="agent-age"
            className="block text-sm font-medium text-gray-900"
          >
            Age
          </label>
          <Input
            id="agent-age"
            type="number"
            value={draft.age}
            onChange={set('age')}
            placeholder="optional"
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="agent-description"
            className="block text-sm font-medium text-gray-900"
          >
            Description
          </label>
          <Textarea
            id="agent-description"
            rows={3}
            value={draft.description}
            onChange={set('description')}
            placeholder="One to three sentences on personality or background."
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="agent-actions"
            className="block text-sm font-medium text-gray-900"
          >
            Actions <span className="text-red-600">*</span>
          </label>
          <ChipInput
            id="agent-actions"
            value={draft.actions}
            onChange={set('actions')}
            placeholder="e.g. request_payment (press Enter to add)"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Free text. Press Enter or comma to add. Backspace on empty input
            removes the last chip.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AgentForm;
