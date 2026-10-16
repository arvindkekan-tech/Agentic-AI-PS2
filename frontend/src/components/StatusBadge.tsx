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
          bg: 'bg-[#C7F36B]/15',
          border: 'border-[#C7F36B]/30',
          text: 'text-[#C7F36B]',
          icon: CheckCircle2
        };
      case 'partial_or_needs_review':
        return {
          label: 'Needs Review',
          bg: 'bg-[#F3B66D]/15',
          border: 'border-[#F3B66D]/30',
          text: 'text-[#F3B66D]',
          icon: AlertCircle
        };
      case 'not_demonstrated_in_analyzed_scope':
        return {
          label: 'Not in Scope',
          bg: 'bg-[#282B36]',
          border: 'border-[#3B4050]',
          text: 'text-[#9A9FB1]',
          icon: MinusCircle
        };
      case 'unable_to_assess':
      default:
        return {
          label: 'Unable to Assess',
          bg: 'bg-[#E77D83]/15',
          border: 'border-[#E77D83]/30',
          text: 'text-[#E77D83]',
          icon: HelpCircle
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} tracking-wide transition-colors font-mono`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
