import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const Input = forwardRef(
  (
    {
      value,
      onChange,
      placeholder,
      type = 'text',
      disabled = false,
      id,
      name,
      className,
      ...rest
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900',
          'shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400',
          'focus:ring-2 focus:ring-inset focus:ring-indigo-600',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          className
        )}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
