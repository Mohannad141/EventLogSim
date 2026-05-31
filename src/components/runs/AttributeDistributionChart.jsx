import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DEFAULT_COLOR = '#A8D8EA';


const SingleAttributeChart = ({ attribute, height = 220 }) => {
  const data = (attribute.values || []).map((v) => ({
    value: String(v.value),
    count: v.count,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No data.</p>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="value"
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#374151' }} />
          <Tooltip
            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="count"
            fill={DEFAULT_COLOR}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const MultiAttributeChart = ({ name, data, series, height = 240 }) => (
  <div style={{ width: '100%', height }}>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="value"
          tick={{ fontSize: 12, fill: '#374151' }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#374151' }} />
        <Tooltip
          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color || DEFAULT_COLOR}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
    <div className="sr-only">{name}</div>
  </div>
);

const buildMultiAttributeData = (attributeName, runs, series) => {
  const valueSet = new Set();
  for (const run of runs) {
    const attr = run.stats?.attributeDistribution?.find(
      (a) => a.name === attributeName
    );
    attr?.values?.forEach((v) => valueSet.add(String(v.value)));
  }
  const values = Array.from(valueSet);
  return values.map((value) => {
    const row = { value };
    runs.forEach((run, index) => {
      const seriesKey = series[index].key;
      const attr = run.stats?.attributeDistribution?.find(
        (a) => a.name === attributeName
      );
      const found = attr?.values?.find((v) => String(v.value) === value);
      row[seriesKey] = found ? found.count : 0;
    });
    return row;
  });
};

const AttributeDistributionChart = ({
  attributes = [],
  emptyMessage = 'No custom attribute distributions.',
  multi,
}) => {
  if (multi) {
    const { runs, series } = multi;
    const allNames = new Set();
    runs.forEach((r) =>
      r.stats?.attributeDistribution?.forEach((a) => allNames.add(a.name))
    );
    const names = Array.from(allNames);
    if (names.length === 0) {
      return <p className="text-sm text-gray-500">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-6">
        {names.map((name) => (
          <div key={name}>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              {name}
            </h4>
            <MultiAttributeChart
              name={name}
              data={buildMultiAttributeData(name, runs, series)}
              series={series}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!attributes.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => (
        <div key={attribute.name}>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            {attribute.name}
          </h4>
          <SingleAttributeChart attribute={attribute} />
        </div>
      ))}
    </div>
  );
};

export default AttributeDistributionChart;
