import { Link } from 'react-router-dom';
import { Activity, Database, GitCompare, Sparkles } from 'lucide-react';

const stats = [
  { label: 'Simulation Runs', value: '12', icon: Activity, iconClass: 'bg-sky-100 text-sky-600', },
  { label: 'Generated Events', value: '45k+', icon: Database, iconClass: 'bg-cyan-100 text-cyan-600', },
  { label: 'Run Comparisons', value: '4', icon: GitCompare, iconClass: 'bg-sky-100 text-sky-600', },
];

const HomePage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
      <div className="grid items-center gap-10 xl:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
              <Sparkles className="h-4 w-4" />
              LLM-based simulation platform
            </span>

            <div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
          EventLogSim
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Configure processes, agents and attributes, run simulations, and
                analyze the generated event logs with visual dashboards.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
              <Link
                to="/configuration"
                className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
              >
                New Simulation
              </Link>
              <Link
                to="/runs"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                View Runs
              </Link>
            </div>
          </div>

        <div className="rounded-3xl bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 p-6 text-slate-800 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Workflow</p>
            <div className="mt-6 space-y-4">
              {['Configure', 'Simulate', 'Analyze', 'Compare'].map((step, index) => (
              
                <div key={step} className="rounded-2xl border border-sky-100 bg-white/70 p-4 backdrop-blur">
                  <p className="text-sm text-slate-500">Step {index + 1}</p>
                  <p className="text-xl font-semibold text-sky-700">{step}</p>
                </div>
              )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${iconClass}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
