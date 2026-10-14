import React from 'react';
import { BookOpen } from 'lucide-react';

export const Logo = ({ size = 'normal', showSubtitle = true, showTagline = false, className = '' }) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  // If large, show tagline along with subtitle by default unless explicitly turned off
  const shouldShowTagline = showTagline || (isLarge && showSubtitle);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* LibXVerse Emblem: Midnight Navy base with Cosmic Gradient & Digital Sparkle */}
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-tr from-[#7657FF] via-[#35B8FF] to-[#58E1E8] p-0.5 shadow-lg shadow-[#7657FF]/25 ${
          isLarge ? 'w-14 h-14' : isSmall ? 'w-9 h-9 rounded-xl' : 'w-11 h-11'
        }`}
      >
        <div className="w-full h-full bg-[#0B1020] rounded-[14px] flex items-center justify-center text-[#F5F7FF] border border-white/20 relative overflow-hidden">
          {/* Subtle cosmic aura inside emblem */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#7657FF]/25 via-transparent to-[#35B8FF]/20 pointer-events-none" />
          
          {/* Geometric Open Book with Cosmic Aura */}
          <BookOpen
            className={`${
              isLarge ? 'w-7 h-7' : isSmall ? 'w-4 h-4' : 'w-5 h-5'
            } text-[#F5F7FF] stroke-[2.2] drop-shadow-[0_2px_8px_rgba(53,184,255,0.4)] relative z-10`}
          />
        </div>

        {/* Cosmic Node / Digital Element */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-tr from-[#58E1E8] to-[#35B8FF] ring-2 ring-[#0B1020] shadow-sm shadow-[#58E1E8]/80 animate-pulse" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 leading-none">
          <span
            className={`font-display font-black tracking-tight text-slate-900 dark:text-[#F5F7FF] ${
              isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-xl'
            }`}
          >
            Lib<span className="bg-gradient-to-r from-[#7657FF] via-[#35B8FF] to-[#58E1E8] bg-clip-text text-transparent">X</span>Verse
          </span>
          <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-[#7657FF]/10 text-[#7657FF] dark:text-[#35B8FF] border border-[#7657FF]/20 backdrop-blur-md">
            SMART
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-medium text-slate-500 dark:text-slate-400 tracking-tight ${
              isLarge ? 'text-xs mt-1.5' : 'text-[11px] mt-0.5'
            }`}
          >
            Smart Library Management System
          </span>
        )}

        {shouldShowTagline && (
          <span
            className={`font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#7657FF] to-[#35B8FF] ${
              isLarge ? 'text-[11px] mt-1' : 'text-[10px] mt-0.5'
            }`}
          >
            Explore Beyond Pages.
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
