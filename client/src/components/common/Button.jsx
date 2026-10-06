import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 text-white shadow-lg shadow-brand-500/25 border border-white/20 focus:ring-brand-500',
    secondary:
      'glass-panel hover:bg-white/90 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 shadow-sm focus:ring-slate-400',
    outline:
      'bg-transparent hover:bg-white/40 dark:hover:bg-white/5 border border-slate-300/80 dark:border-white/15 text-slate-700 dark:text-slate-200 backdrop-blur-md focus:ring-brand-500',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-500/25 border border-white/20 focus:ring-rose-500',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 border border-white/20 focus:ring-emerald-500',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white backdrop-blur-xs focus:ring-slate-400',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs gap-1.5',
    sm: 'px-3.5 py-2 text-xs gap-1.5',
    md: 'px-4.5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    icon: 'p-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className={`${size === 'sm' || size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
