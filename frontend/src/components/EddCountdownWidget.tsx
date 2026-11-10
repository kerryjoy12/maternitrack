import { useEddCountdown } from '../hooks/useEddCountdown';
import { AlertTriangle, Zap, Clock, Calendar } from 'lucide-react';

interface EddCountdownWidgetProps {
  edd: string | null | undefined;
  weeksPregnant?: number | null;
  compact?: boolean;
}

/**
 * EddCountdownWidget
 * ------------------
 * Displays a visual EDD countdown with a progress arc, urgency colour coding,
 * and a breakdown of weeks + days remaining.
 */
export default function EddCountdownWidget({ edd, weeksPregnant, compact = false }: EddCountdownWidgetProps) {
  const cd = useEddCountdown(edd);

  if (!cd) return <span className="text-muted">—</span>;

  const urgencyClass = {
    overdue:  'edd-widget--overdue',
    imminent: 'edd-widget--imminent',
    soon:     'edd-widget--soon',
    normal:   'edd-widget--normal',
  }[cd.urgency];

  // Progress bar: 40 weeks = full term, clamp to 0–100%
  const totalWeeks = 40;
  const weeksElapsed = weeksPregnant ?? (totalWeeks - cd.weeksLeft);
  const progress = Math.min(100, Math.max(0, (weeksElapsed / totalWeeks) * 100));

  if (compact) {
    return (
      <span className={`edd-compact ${urgencyClass}`}>
        {cd.isOverdue && <span className="edd-compact__dot edd-compact__dot--flash" />}
        {cd.label}
      </span>
    );
  }

  return (
    <div className={`edd-widget ${urgencyClass}`}>
      {/* Header */}
      <div className="edd-widget__header">
        <span className="edd-widget__icon">
          {cd.isOverdue ? <AlertTriangle size={16} /> : cd.isImminent ? <Zap size={16} /> : cd.isDueSoon ? <Clock size={16} /> : <Calendar size={16} />}
        </span>
        <div>
          <div className="edd-widget__label">EDD Countdown</div>
          <div className="edd-widget__value">{cd.label}</div>
        </div>
      </div>

      {/* Week / Day breakdown */}
      {!cd.isOverdue && (
        <div className="edd-widget__breakdown">
          <div className="edd-widget__stat">
            <span className="edd-widget__stat-num">{cd.weeksLeft}</span>
            <span className="edd-widget__stat-unit">weeks</span>
          </div>
          <div className="edd-widget__divider">+</div>
          <div className="edd-widget__stat">
            <span className="edd-widget__stat-num">{cd.daysRemainder}</span>
            <span className="edd-widget__stat-unit">days</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="edd-widget__progress-track">
        <div
          className="edd-widget__progress-fill"
          style={{ width: `${progress}%` }}
          title={`${Math.round(progress)}% through pregnancy`}
        />
      </div>
      <div className="edd-widget__progress-labels">
        <span>Week 0</span>
        <span>{weeksPregnant != null ? `Week ${weeksPregnant} now` : ''}</span>
        <span>Week 40</span>
      </div>
    </div>
  );
}
