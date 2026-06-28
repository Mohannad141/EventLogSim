import { NavLink } from 'react-router-dom';
import { Home, Settings, History, Sparkles, Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/configuration', label: 'Configuration', icon: Settings },
  { to: '/runs', label: 'Runs', icon: History },
];

const Sidebar = ({ isOpen, onToggle }) => {
  if (!isOpen) {
  return (
      <button
        onClick={onToggle}
        className="fixed left-5 top-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
      >
        <Menu className="h-6 w-6" />
      </button>
    );
  }
  return(
    <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-white">
        <button
        onClick={onToggle}
        className="absolute -right-4 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-slate-300 hover:bg-indigo-500 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8 flex items-center gap-3 px-2 pr-12">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5" />
        </div>

        
        <div>
          <p className="text-lg font-bold tracking-tight">EventLogSim</p>
          <p className="text-xs text-slate-400">Simulation Dashboard</p>
        </div>
        
      </div>

      <nav className="space-y-2">
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5 " />
            {label}
          </NavLink>
        ))}
      </nav>

      {isOpen && (

      <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-semibold text-white">Project Status</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Generate, store and compare simulated event logs.
        </p>
      </div>
      )}
    </aside>
  );
};

export default Sidebar;