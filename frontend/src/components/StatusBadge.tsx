import React from 'react';
import { CaseStatus, SightingStatus, AIMatchStatus, TaskStatus } from '../types';

interface StatusBadgeProps {
  status: CaseStatus | SightingStatus | AIMatchStatus | TaskStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (status) {
    case 'Active Search':
    case 'In Progress':
      badgeStyle = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 glow-border';
      break;
    case 'Under Review':
    case 'Assigned':
      badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      break;
    case 'Potential Match':
    case 'Confirmed Match':
    case 'Verified':
    case 'Completed':
    case 'Resolved':
      badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      break;
    case 'Rejected':
    case 'Cancelled':
      badgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      break;
    case 'Submitted':
    case 'Open':
    case 'Pending Review':
      badgeStyle = 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      break;
    case 'Needs More Info':
    case 'Archived':
      badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
