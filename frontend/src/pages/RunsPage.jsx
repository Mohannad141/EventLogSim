import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, FileBarChart } from 'lucide-react';
import Button from '../components/primitives/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import RunListHeader from '../components/runs/RunListHeader.jsx';
import RunCard from '../components/runs/RunCard.jsx';
import SelectionToolbar from '../components/runs/SelectionToolbar.jsx';
import ComparePanel from '../components/runs/ComparePanel.jsx';
import { useRuns } from '../hooks/useRuns.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { deleteRuns } from '../lib/api.js';

const MAX_SELECTION = 4;

const parseCompareParam = (raw) =>
  (raw || '').split(',').map((s) => s.trim()).filter(Boolean);

const RunsPage = () => {
  const { runs, loading, error, refresh } = useRuns();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const compareIds = useMemo(
    () => parseCompareParam(searchParams.get('compare')),
    [searchParams]
  );

  const [selectedIds, setSelectedIds] = useState(new Set(compareIds));
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDeleteRuns, setConfirmDeleteRuns] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set(compareIds));
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id, checked) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    return next;
  });
};

  const clearSelection = () => {
    setSelectedIds(new Set());
    if (compareIds.length > 0) setSearchParams({});
  };

  const openCompare = () => {
    if (selectedIds.size < 2) return;
    setSearchParams({ compare: Array.from(selectedIds).join(',') });
  };

  const closeCompare = () => {
    setSearchParams({});
    setSelectedIds(new Set());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const showCompare = compareIds.length >= 2;
  const deleteSelectedRuns = () => {
  setConfirmDeleteRuns(true);
};
  const allEvents = runs.flatMap((run) => run.result || []);

const numberOfEvents = allEvents.length;
const numberOfCases = new Set(allEvents.map((event) => event.case_id)).size;
const numberOfActivities = new Set(allEvents.map((event) => event.activity)).size;
const averageEventsPerCase =
  numberOfCases > 0 ? (numberOfEvents / numberOfCases).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <RunListHeader onRefresh={onRefresh} refreshing={refreshing} />

      {showCompare && (
        <ComparePanel runIds={compareIds} onClose={closeCompare} />
      )}

      <SelectionToolbar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onDelete={deleteSelectedRuns}
        onCompare={openCompare}
        comparing={showCompare}
      />
      <ConfirmDialog
  open={confirmDeleteRuns}
  onClose={() => setConfirmDeleteRuns(false)}
  title="Delete selected runs?"
  message={`Delete ${selectedIds.size} selected ${
    selectedIds.size === 1 ? 'run' : 'runs'
  }? This cannot be undone.`}
  confirmLabel="Delete"
  variant="danger"
  onConfirm={async () => {
    try {
      await deleteRuns(Array.from(selectedIds));
      await refresh();
      clearSelection();
      setConfirmDeleteRuns(false);
    } catch (error) {
    console.error('Failed to delete runs:', error);
  }
}}
/>

      {loading && runs.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-white ring-1 ring-gray-200"
            />
          ))}
        </div>
      ) : error && runs.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <div className="font-semibold">Could not load runs.</div>
              <div className="mt-0.5 text-red-700">{error.message}</div>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={onRefresh}>
            {refreshing ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Retry
          </Button>
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No runs yet"
          message="Configure a simulation to generate your first event log."
          action={
            <Button onClick={() => navigate('/configuration')}>
              Go to Configuration
            </Button>
          }
        />
          ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">Cases</p>
              <p className="mt-2 text-2xl font-bold">{numberOfCases}</p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">Events</p>
              <p className="mt-2 text-2xl font-bold">{numberOfEvents}</p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">Activities</p>
              <p className="mt-2 text-2xl font-bold">{numberOfActivities}</p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">Avg. events / case</p>
              <p className="mt-2 text-2xl font-bold">{averageEventsPerCase}</p>
            </div>
          </div>

          <div className="space-y-3">
            {runs.map((run) => {
              const selected = selectedIds.has(run.id);
              const selectable = true;

              return (
                <RunCard
                  key={run.id}
                  run={run}
                  selected={selected}
                  selectable={selectable}
                  onSelectChange={(checked) => toggleSelect(run.id, checked)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunsPage;
