import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const Textarea = forwardRef(
  (
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      id,
      name,
      rows = 4,
      className,
      ...rest
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900',
          'shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400',
          'focus:ring-2 focus:ring-inset focus:ring-indigo-600',
          'resize-y',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          className
        )}
        {...rest}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
