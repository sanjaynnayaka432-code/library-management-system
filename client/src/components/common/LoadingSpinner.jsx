import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}>
      <Loader2
        className={`animate-spin text-brand-600 dark:text-brand-400 ${
          size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
        }`}
      />
      {text && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
