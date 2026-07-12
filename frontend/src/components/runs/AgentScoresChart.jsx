import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const BAR_COLOR = (score) => {
  if (score < 5)    return '#fca5a5'; // red-300
  if (score <= 7.5) return '#fde68a'; // yellow-200
  return '#86efac';                    // green-300
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { avg_score, case_count } = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow">
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-gray-600">Avg score: <strong>{avg_score.toFixed(2)}</strong></p>
      <p className="text-gray-500">{case_count} case{case_count !== 1 ? 's' : ''}</p>
    </div>
  );
};

const AgentScoresChart = ({ agents = [], height = 280 }) => {
  if (!agents.length) {
    return <p className="text-sm text-gray-500">No agent score data.</p>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={agents}
          margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="agent_id"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11, fill: '#374151' }}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#374151' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="avg_score" radius={[4, 4, 0, 0]} name="Avg Score">
            {agents.map((entry, i) => (
              <Cell key={i} fill={BAR_COLOR(entry.avg_score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgentScoresChart;
