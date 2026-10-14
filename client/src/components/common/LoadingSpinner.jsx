import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md', className = '' }) => {
  const isLarge = size === 'lg';

  if (isLarge) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 gap-4 select-none ${className}`}>
        {/* LibXVerse Branded Loading Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Cosmic Aura Ring */}
          <div className="absolute w-16 h-16 rounded-full border-2 border-dashed border-[#35B8FF]/60 animate-spin" />
          <div className="w-12 h-12 rounded-2xl bg-[#0B1020] border border-[#7657FF]/40 shadow-lg shadow-[#7657FF]/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7657FF]/20 to-[#35B8FF]/20" />
            <BookOpen className="w-6 h-6 text-[#F5F7FF] stroke-[2.2] drop-shadow-[0_0_8px_rgba(53,184,255,0.6)]" />
          </div>
          {/* Cosmic Accent Spark */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-tr from-[#58E1E8] to-[#35B8FF] ring-2 ring-[#0B1020] shadow-sm shadow-[#58E1E8]/80 animate-pulse" />
        </div>

        {text && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 animate-pulse">
              {text}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#7657FF] dark:text-[#35B8FF]">
              LibXVerse
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 ${className}`}>
      <Loader2
        className={`animate-spin text-[#7657FF] dark:text-[#35B8FF] ${
          size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'
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
