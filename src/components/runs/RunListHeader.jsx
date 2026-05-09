import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import Button from '../primitives/Button.jsx';
import { cn } from '../../utils/cn.js';

const RunListHeader = ({ onRefresh, refreshing }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Runs
        </h1>
        <p className="mt-1 text-sm text-gray-600">Past simulation runs.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw
            className={cn('mr-1 h-3.5 w-3.5', refreshing && 'animate-spin')}
          />
          Refresh
        </Button>
        <Link to="/configuration">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            New Run
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RunListHeader;
