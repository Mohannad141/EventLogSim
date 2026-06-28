import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-sky-500 shadow-sm',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-sky-50 hover:ring-sky-200 focus-visible:outline-sky-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-sky-300',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:outline-red-500',
};

const SIZES = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
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
