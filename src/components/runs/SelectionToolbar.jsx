import { BarChart3, X } from 'lucide-react';
import Button from '../primitives/Button.jsx';

const MAX_SELECTION = 4;

const SelectionToolbar = ({
  selectedCount,
  onClear,
  onCompare,
  comparing,
}) => {
  if (selectedCount === 0) return null;

  const canCompare = selectedCount >= 2 && !comparing;

  return (
    <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm">
      <span className="text-indigo-900">
        {selectedCount === 1
          ? 'Select another run to compare'
          : `Compare ${selectedCount} runs`}{' '}
        <span className="text-indigo-700">
          ({selectedCount}/{MAX_SELECTION} selected)
        </span>
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
        <Button
          size="sm"
          onClick={onCompare}
          disabled={!canCompare}
          title={
            selectedCount < 2
              ? 'Select at least 2 runs to compare'
              : comparing
                ? 'Already showing comparison below'
                : undefined
          }
        >
          <BarChart3 className="mr-1 h-3.5 w-3.5" />
          Compare
        </Button>
      </div>
    </div>
  );
};

export default SelectionToolbar;
