import React from 'react';

const statusConfig = {
  ACTIVE: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
  },
  INACTIVE: {
    bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    dot: 'bg-slate-400'
  },
  ISSUED: {
    bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
  },
  RETURNED: {
    bg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
    dot: 'bg-teal-400'
  },
  OVERDUE: {
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 animate-pulse',
    dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
  },
  WAITING: {
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
  },
  FULFILLED: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
  },
  CANCELLED: {
    bg: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
    dot: 'bg-slate-400'
  },
  PENDING: {
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
  },
  PAID: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
  },
  AVAILABLE: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
  },
  UNAVAILABLE: {
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
  },
  ADMIN: {
    bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
  },
  STUDENT: {
    bg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
  },
};

export const Badge = ({ status, text, size = 'sm', withDot = true, className = '' }) => {
  const normalizedKey = (status || text || '').toUpperCase();
  const config = statusConfig[normalizedKey] || {
    bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
    dot: 'bg-slate-400',
  };

  const displayText = text || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border backdrop-blur-md ${config.bg} ${
        size === 'xs' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />}
      {displayText}
    </span>
  );
};

export default Badge;
