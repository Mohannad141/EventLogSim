import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DEFAULT_COLOR = '#6366f1';
const COLORS = [
  '#A8D8EA',
  '#AAE3A1',
  '#FFD3B6',
  '#FFAAA5',
  '#D5AAFF',
  '#B5EAD7',
];

const EventDistributionChart = ({
  data = [],
  series,
  height = 300,
  emptyMessage = 'No event distribution data.',
}) => {
  if (!data.length) {
    return (
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    );
  }

  const isMulti = Array.isArray(series) && series.length > 0;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="activity"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99,102,241,0.08)' }}
            contentStyle={{ fontSize: 12 }}
          />
          {isMulti && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {isMulti ? (
            series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color || DEFAULT_COLOR}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            <Bar
  dataKey="count"
  radius={[4, 4, 0, 0]}
>
  {data.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventDistributionChart;
