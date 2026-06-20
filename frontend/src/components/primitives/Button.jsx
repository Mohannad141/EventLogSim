import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary:
    'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-gray-400',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-sm rounded-md',
  md: 'px-3.5 py-2 text-sm rounded-md',
  lg: 'px-4 py-2.5 text-base rounded-md',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
