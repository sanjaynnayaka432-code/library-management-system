import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`glass-card rounded-3xl overflow-hidden ${
        glow ? 'shadow-glow-brand' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between px-6 py-4.5 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
