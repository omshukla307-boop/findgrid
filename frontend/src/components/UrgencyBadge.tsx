import React from 'react';
import { CaseUrgency } from '../types';

interface UrgencyBadgeProps {
  urgency: CaseUrgency | string;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, className = '' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let pulse = false;

  switch (urgency) {
    case 'Critical':
      badgeStyle = 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950';
      pulse = true;
      break;
    case 'High':
      badgeStyle = 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950';
      break;
    case 'Medium':
      badgeStyle = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      break;
    case 'Low':
      badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badgeStyle} ${className}`}>
      {pulse ? (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      )}
      {urgency}
    </span>
  );
};
