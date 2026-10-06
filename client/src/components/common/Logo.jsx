import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export const Logo = ({ size = 'normal', showSubtitle = true, className = '' }) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Frosted Glass Emblem */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/25 ${
          isLarge ? 'w-14 h-14' : isSmall ? 'w-9 h-9 rounded-xl' : 'w-11 h-11'
        }`}
      >
        <div className="w-full h-full bg-slate-900/40 backdrop-blur-md rounded-[14px] flex items-center justify-center text-white border border-white/30">
          <BookOpen
            className={`${
              isLarge ? 'w-7 h-7' : isSmall ? 'w-4 h-4' : 'w-5 h-5'
            } stroke-[2.3] drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]`}
          />
        </div>
        {/* Iridescent Accent Sparkle */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-tr from-accent-cyan to-emerald-400 ring-2 ring-white/80 dark:ring-dark-950 shadow-sm shadow-accent-cyan/80 animate-pulse" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={`font-display font-black tracking-tight text-slate-900 dark:text-white ${
              isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-xl'
            }`}
          >
            Libra
            <span className="bg-gradient-to-r from-brand-500 via-indigo-500 to-accent-cyan bg-clip-text text-transparent drop-shadow-sm">
              X
            </span>
          </span>
          <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 backdrop-blur-md">
            SMART
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium text-slate-500 dark:text-slate-400 tracking-tight ${
              isLarge ? 'text-xs mt-1' : 'text-[11px] mt-0.5'
            }`}
          >
            Next-Gen Library Operating System
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
