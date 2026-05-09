import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import Card from '../components/primitives/Card.jsx';
import Button from '../components/primitives/Button.jsx';
import Badge from '../components/primitives/Badge.jsx';
import StatsCard from '../components/runs/StatsCard.jsx';
import EventDistributionChart from '../components/runs/EventDistributionChart.jsx';
import AttributeDistributionChart from '../components/runs/AttributeDistributionChart.jsx';
import TraceVariantsList from '../components/runs/TraceVariantsList.jsx';
import EventLogTable from '../components/runs/EventLogTable.jsx';
import { useRunDetail } from '../hooks/useRunDetail.js';
import { formatRelativeTime } from '../utils/format.js';

const STATUS_VARIANT = {
  completed: 'success',
  running: 'warning',
  failed: 'danger',
};

const downloadJson = (run) => {
  const blob = new Blob([JSON.stringify(run, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `run_${run.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const RunDetailPage = () => {
  const { id } = useParams();
  const { run, loading, error, refresh } = useRunDetail(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/runs"
          className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:text-indigo-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to runs
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading run…
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <div className="font-semibold">Could not load run.</div>
              <div className="mt-0.5 text-red-700">{error.message}</div>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && run && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {run.configName || 'Untitled run'}
              </h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                <span className="font-mono text-xs">{run.id}</span>
                <Badge variant={STATUS_VARIANT[run.status] || 'neutral'}>
                  {run.status || 'unknown'}
                </Badge>
                {run.createdAt && (
                  <span>{formatRelativeTime(run.createdAt)}</span>
                )}
              </div>
            </div>
            <Button variant="secondary" onClick={() => downloadJson(run)}>
              <Download className="mr-1 h-4 w-4" />
              Export JSON
            </Button>
          </div>

          <Card>
            <StatsCard
              stats={{ ...(run.stats || {}), duration: run.duration }}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Event Distribution
            </h2>
            <EventDistributionChart
              data={run.stats?.eventDistribution || []}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Attribute Distribution
            </h2>
            <AttributeDistributionChart
              attributes={run.stats?.attributeDistribution || []}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Top Trace Variants
            </h2>
            <TraceVariantsList variants={run.stats?.topVariants || []} />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Event Log
            </h2>
            <EventLogTable
              events={run.events || []}
              configSnapshot={run.configSnapshot}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default RunDetailPage;
