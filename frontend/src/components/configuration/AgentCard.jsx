import { Pencil, Trash2 } from 'lucide-react';
import Card from '../primitives/Card.jsx';
import Badge from '../primitives/Badge.jsx';
import { cn } from '../../utils/cn.js';

const initialsOf = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AgentCard = ({ agent, onEdit, onDelete }) => {
  return (
    <Card className="relative flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-sky-100 text-sm font-bold text-sky-700">
            {initialsOf(agent.name)}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {agent.name || <span className="italic text-gray-400">Unnamed</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge variant="info">{agent.role || 'no role'}</Badge>
              {agent.age != null && (
                <span className="text-xs text-gray-500">Age {agent.age}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Edit agent"
            onClick={() => onEdit?.(agent)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Delete agent"
            onClick={() => onDelete?.(agent)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {agent.description && (
        <p className={cn('text-sm leading-5 text-gray-700', 'line-clamp-3')}>
          {agent.description}
        </p>
      )}

      {agent.actions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.actions.map((a) => (
            <span
              key={a}
              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AgentCard;
