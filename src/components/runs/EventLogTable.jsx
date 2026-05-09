import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../primitives/Button.jsx';
import { ESSENTIAL_ATTRIBUTE_IDS } from '../../data/essentialAttributes.js';

const ESSENTIAL_NAMES = new Set(['caseId', 'activity', 'timestamp']);

const formatCell = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const EventLogTable = ({
  events = [],
  configSnapshot,
  pageSize = 50,
}) => {
  const customColumns = useMemo(() => {
    const fromConfig = (configSnapshot?.attributes || [])
      .filter(
        (a) =>
          !a.locked &&
          !ESSENTIAL_ATTRIBUTE_IDS.includes(a.id) &&
          !ESSENTIAL_NAMES.has(a.name)
      )
      .map((a) => a.name);

    if (fromConfig.length > 0) return fromConfig;

    const set = new Set();
    for (const ev of events) {
      const attrs = ev?.attributes || {};
      for (const k of Object.keys(attrs)) {
        if (!ESSENTIAL_NAMES.has(k)) set.add(k);
      }
    }
    return Array.from(set);
  }, [configSnapshot, events]);

  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const slice = events.slice(start, start + pageSize);

  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No events to display.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                'Case ID',
                'Activity',
                'Timestamp',
                'Resource',
                'Role',
                ...customColumns,
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {slice.map((ev, i) => (
              <tr key={`${ev.caseId}-${start + i}`} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-700">
                  {formatCell(ev.caseId)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900">
                  {formatCell(ev.activity)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {formatCell(ev.timestamp)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {formatCell(ev.resource)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {formatCell(ev.role)}
                </td>
                {customColumns.map((col) => (
                  <td
                    key={col}
                    className="whitespace-nowrap px-3 py-2 text-gray-700"
                  >
                    {formatCell(ev?.attributes?.[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          Showing {start + 1}–{Math.min(start + pageSize, events.length)} of{' '}
          {events.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Prev
          </Button>
          <span>
            Page {safePage + 1} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventLogTable;
