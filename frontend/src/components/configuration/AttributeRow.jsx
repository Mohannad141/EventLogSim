import { Lock, Trash2 } from 'lucide-react';
import Input from '../primitives/Input.jsx';
import { cn } from '../../utils/cn.js';

const TYPES = ['string', 'number', 'datetime', 'boolean'];

const AttributeRow = ({ attribute, onChange, onDelete }) => {
  const locked = !!attribute.locked;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2',
        locked ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex-1">
        {locked ? (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Lock className="h-3.5 w-3.5 text-gray-400" />
            {attribute.name}
          </div>
        ) : (
          <Input
            value={attribute.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="attribute_name"
          />
        )}
      </div>
      <div className="w-40">
        {locked ? (
          <span className="inline-block rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
            {attribute.type}
          </span>
        ) : (
          <select
            value={attribute.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="block w-full rounded-md border-0 px-2 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="w-10 text-right">
        {locked ? (
          <span className="text-xs text-gray-400">—</span>
        ) : (
          <button
            type="button"
            aria-label="Delete attribute"
            onClick={onDelete}
            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AttributeRow;
