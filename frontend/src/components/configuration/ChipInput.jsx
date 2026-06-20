import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const ChipInput = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter…',
  className,
  id,
}) => {
  const [pending, setPending] = useState('');

  const commit = (raw) => {
    const text = (raw ?? pending).trim();
    if (!text) return;
    if (value.includes(text)) {
      setPending('');
      return;
    }
    onChange?.([...value, text]);
    setPending('');
  };

  const removeAt = (index) => {
    const next = value.filter((_, i) => i !== index);
    onChange?.(next);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && pending === '' && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600',
        className
      )}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
        >
          {chip}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`Remove ${chip}`}
            className="rounded-sm p-0.5 hover:bg-indigo-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={pending}
        onChange={(e) => setPending(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit()}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
    </div>
  );
};

export default ChipInput;
