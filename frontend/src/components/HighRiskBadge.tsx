import React from 'react';
import { RiskLevel } from '../types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface HighRiskBadgeProps {
  riskLevel: RiskLevel;
  /** Show as inline badge only (no border effect) — for tables */
  inline?: boolean;
  /** Wrap a card div with the flashing border effect */
  wrapCard?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HighRiskBadge
 * -------------
 * Renders a visual risk indicator:
 * - HIGH   → flashing red animated badge + pulsing red border (when wrapCard=true)
 * - MEDIUM → amber static badge
 * - LOW    → green static badge
 */
export default function HighRiskBadge({
  riskLevel,
  inline = false,
  wrapCard = false,
  children,
  className = '',
  style,
}: HighRiskBadgeProps) {
  const isHigh   = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const badge = (
    <span
      className={`risk-badge risk-badge--${riskLevel.toLowerCase()} ${isHigh ? 'risk-badge--flash' : ''} flex items-center gap-1`}
    >
      {isHigh && <AlertTriangle size={12} />}
      {isMedium && <AlertTriangle size={12} />}
      {!isHigh && !isMedium && <ShieldCheck size={12} />}
      {isHigh ? 'HIGH RISK' : isMedium ? 'MEDIUM' : 'LOW RISK'}
    </span>
  );

  if (inline) return badge;

  if (wrapCard) {
    return (
      <div
        className={`risk-card-wrap ${isHigh ? 'risk-card-wrap--high' : isMedium ? 'risk-card-wrap--medium' : ''} ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`risk-indicator ${className}`} style={style}>
      {badge}
      {children}
    </div>
  );
}
