import { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import Button from '../primitives/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import AttributeRow from './AttributeRow.jsx';

const AttributesStep = ({
  attributes,
  onAdd,
  onUpdate,
  onRemove,
  onResetStep,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const essentials = attributes.filter((a) => a.locked);
  const customs = attributes.filter((a) => !a.locked);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Event Log Attributes
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Essential attributes are required by the XES standard. Add custom
            ones as needed.
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

      <section>
        <h3 className="mb-2 text-sm font-medium text-gray-900">
          Essential (locked)
        </h3>
        <div className="space-y-2">
          {essentials.map((a) => (
            <AttributeRow key={a.id} attribute={a} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-gray-900">Custom</h3>
        {customs.length === 0 ? (
          <p className="text-sm text-gray-500">No custom attributes yet.</p>
        ) : (
          <div className="space-y-2">
            {customs.map((a) => (
              <AttributeRow
                key={a.id}
                attribute={a}
                onChange={(changes) => onUpdate(a.id, changes)}
                onDelete={() => onRemove(a.id)}
              />
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => onAdd()}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add attribute
        </Button>
      </section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Attributes step?"
        message="This will remove all custom attributes. Essentials remain locked."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={onResetStep}
      />
    </div>
  );
};

export default AttributesStep;
