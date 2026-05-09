const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export const formatRelativeTime = (date) => {
  const target = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - target.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  const fmt = (value, unit) => {
    const plural = value === 1 ? unit : `${unit}s`;
    return future ? `in ${value} ${plural}` : `${value} ${plural} ago`;
  };

  if (abs < 5 * SECOND) return future ? 'in a moment' : 'just now';
  if (abs < MINUTE) return fmt(Math.round(abs / SECOND), 'second');
  if (abs < HOUR) return fmt(Math.round(abs / MINUTE), 'minute');
  if (abs < DAY) return fmt(Math.round(abs / HOUR), 'hour');
  if (abs < 2 * DAY) return future ? 'tomorrow' : 'yesterday';
  if (abs < WEEK) return fmt(Math.round(abs / DAY), 'day');
  if (abs < MONTH) return fmt(Math.round(abs / WEEK), 'week');
  if (abs < YEAR) return fmt(Math.round(abs / MONTH), 'month');
  return fmt(Math.round(abs / YEAR), 'year');
};

export const formatNumber = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return Number(n).toLocaleString('en-US');
};

export const formatDuration = (ms) => {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '';
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
};
