import { cn } from '../../utils/cn.js';

const EmptyState = ({ icon: Icon, title, message, action, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center',
        className
      )}
    >
      {Icon && (
        <Icon className="mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
      )}
      {title && (
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      )}
      {message && (
        <p className="mt-1 max-w-sm text-sm text-gray-600">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
