import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import Card from '../primitives/Card.jsx';
import Button from '../primitives/Button.jsx';
import Badge from '../primitives/Badge.jsx';
import EventDistributionChart from './EventDistributionChart.jsx';
import AttributeDistributionChart from './AttributeDistributionChart.jsx';
import TraceVariantsList from './TraceVariantsList.jsx';
import { getRun } from '../../lib/api.js';
import { formatNumber, formatDuration } from '../../utils/format.js';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const buildSeries = (runs) =>
  runs.map((run, i) => ({
    key: `series_${i}`,
    label: run?.configName || run?.id || `Run ${i + 1}`,
    color: PALETTE[i % PALETTE.length],
  }));

const buildEventData = (runs, series) => {
  const set = new Set();
  runs.forEach((run) =>
    run?.stats?.eventDistribution?.forEach((d) => set.add(d.activity))
  );
  return Array.from(set).map((activity) => {
    const row = { activity };
    runs.forEach((run, i) => {
      const found = run?.stats?.eventDistribution?.find(
        (d) => d.activity === activity
      );
      row[series[i].key] = found ? found.count : 0;
    });
    return row;
  });
};

const ComparePanel = ({ runIds = [], onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResults([]);
    setErrors([]);

    Promise.all(
      runIds.map((id) =>
        getRun(id)
          .then((run) => ({ ok: true, id, run }))
          .catch((err) => ({ ok: false, id, error: err }))
      )
    ).then((settled) => {
      if (cancelled) return;
      setResults(settled);
      setErrors(settled.filter((s) => !s.ok));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [runIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const successfulRuns = useMemo(
    () => results.filter((r) => r.ok).map((r) => r.run),
    [results]
  );

  const series = useMemo(() => buildSeries(successfulRuns), [successfulRuns]);
  const eventData = useMemo(
    () => buildEventData(successfulRuns, series),
    [successfulRuns, series]
  );

  return (
    <Card className="space-y-5 p-5 ring-2 ring-indigo-200">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Comparing {runIds.length} run{runIds.length === 1 ? '' : 's'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="mr-1 h-3.5 w-3.5" />
          Close
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {runIds.length} run{runIds.length === 1 ? '' : 's'}…
        </div>
      )}

      {!loading && errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <div className="font-semibold">
                Failed to load {errors.length} run
                {errors.length === 1 ? '' : 's'}.
              </div>
              <ul className="mt-1 list-disc pl-5 text-red-700">
                {errors.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono">{e.id}</span>: {e.error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!loading && successfulRuns.length > 0 && (
        <>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Stats Comparison
            </h3>
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                    >
                      Metric
                    </th>
                    {successfulRuns.map((run, i) => (
                      <th
                        key={run.id}
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700"
                      >
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ backgroundColor: series[i].color }}
                        />
                        {run.configName || run.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {[
                    {
                      label: 'Status',
                      render: (r) => (
                        <Badge
                          variant={
                            r.status === 'completed'
                              ? 'success'
                              : r.status === 'running'
                                ? 'warning'
                                : r.status === 'failed'
                                  ? 'danger'
                                  : 'neutral'
                          }
                        >
                          {r.status || 'unknown'}
                        </Badge>
                      ),
                    },
                    {
                      label: 'Cases',
                      render: (r) => formatNumber(r.stats?.caseCount) || '—',
                    },
                    {
                      label: 'Events',
                      render: (r) => formatNumber(r.stats?.eventCount) || '—',
                    },
                    {
                      label: 'Variants',
                      render: (r) =>
                        formatNumber(r.stats?.variantCount) || '—',
                    },
                    {
                      label: 'Duration',
                      render: (r) =>
                        r.duration != null
                          ? formatDuration(r.duration)
                          : '—',
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {row.label}
                      </td>
                      {successfulRuns.map((run) => (
                        <td
                          key={run.id}
                          className="px-3 py-2 text-sm text-gray-900"
                        >
                          {row.render(run)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Event Distribution
            </h3>
            <EventDistributionChart
              data={eventData}
              series={series}
              height={320}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Attribute Distribution
            </h3>
            <AttributeDistributionChart
              multi={{ runs: successfulRuns, series }}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Top Trace Variants
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {successfulRuns.map((run, i) => (
                <div key={run.id}>
                  <div
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
                    style={{ borderLeft: `3px solid ${series[i].color}`, paddingLeft: 8 }}
                  >
                    {run.configName || run.id}
                  </div>
                  <TraceVariantsList
                    variants={run.stats?.topVariants || []}
                    maxItems={3}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </Card>
  );
};

export default ComparePanel;
