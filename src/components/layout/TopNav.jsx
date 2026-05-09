import { NavLink, Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/configuration', label: 'Configuration' },
  { to: '/runs', label: 'Runs' },
];

const linkClass = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  );

const TopNav = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-gray-900"
        >
          EventLogSim
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
