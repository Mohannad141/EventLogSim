import { cn } from '../../utils/cn.js';

const VARIANTS = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

const Badge = ({ variant = 'neutral', className, children, ...rest }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        VARIANTS[variant] ?? VARIANTS.neutral,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
