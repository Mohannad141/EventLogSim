import { useState } from 'react';
import { Plus, Users, RotateCcw } from 'lucide-react';
import Button from '../primitives/Button.jsx';
import Badge from '../primitives/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import AgentCard from './AgentCard.jsx';
import AgentForm from './AgentForm.jsx';
import { validateAgents } from '../../lib/validation.js';

const AgentsStep = ({
  agents,
  onAdd,
  onUpdate,
  onRemove,
  onResetStep,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { errors } = validateAgents(agents);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (agent) => {
    setEditing(agent);
    setFormOpen(true);
  };

  const handleSave = (agentData) => {
    if (editing) {
      onUpdate(editing.id, agentData);
    } else {
      onAdd(agentData);
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            Agents
            <Badge variant="neutral">{agents.length}</Badge>
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Define the participants. Each agent has a role and a list of
            actions they can perform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset step
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add agent
          </Button>
        </div>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No agents yet"
          message="Add at least one agent to continue."
          action={
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add agent
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={openEdit}
              onDelete={(a) => setConfirmDelete(a)}
            />
          ))}
        </div>
      )}

      {agents.length > 0 && errors.agents && (
        <p className="text-xs text-red-600">{errors.agents}</p>
      )}

      <AgentForm
        open={formOpen}
        agent={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove agent?"
        message={
          confirmDelete
            ? `Remove agent "${confirmDelete.name || 'Unnamed'}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) onRemove(confirmDelete.id);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Agents step?"
        message="This will remove all agents you have added."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={onResetStep}
      />
    </div>
  );
};

export default AgentsStep;
