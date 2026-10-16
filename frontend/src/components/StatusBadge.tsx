import React from 'react';
import { CheckCircle2, AlertCircle, MinusCircle, HelpCircle } from 'lucide-react';
import type { AssessmentStatus } from '../types';

interface StatusBadgeProps {
  status: AssessmentStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'demonstrated':
        return {
          label: 'Demonstrated',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          icon: CheckCircle2
        };
      case 'partial_or_needs_review':
        return {
          label: 'Needs Review',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          icon: AlertCircle
        };
      case 'not_demonstrated_in_analyzed_scope':
        return {
          label: 'Not in Scope',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          text: 'text-slate-700',
          icon: MinusCircle
        };
      case 'unable_to_assess':
      default:
        return {
          label: 'Unable to Assess',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          icon: HelpCircle
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs font-semibold px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1 gap-2'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} transition-colors`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
