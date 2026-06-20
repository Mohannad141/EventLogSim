
import Button from '../primitives/Button.jsx';
import { X, BarChart3, Trash2 } from "lucide-react";

const MAX_COMPARE_SELECTION = 4;

const SelectionToolbar = ({
  selectedCount,
  onClear,
  onDelete,
  onCompare,
  comparing,
}) => {
  if (selectedCount === 0) return null;

  const canCompare =
  selectedCount >= 2 && selectedCount <= MAX_COMPARE_SELECTION && !comparing;

  return (
    <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm">
      <span className="text-indigo-900">
     {selectedCount} {selectedCount === 1 ? 'run' : 'runs'} selected
    </span>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
        <Button
         variant="ghost"
         size="sm"
         onClick={onDelete || (() => alert("Delete clicked"))}
>
        <Trash2 className="mr-1 h-3.5 w-3.5" />
         Delete
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
