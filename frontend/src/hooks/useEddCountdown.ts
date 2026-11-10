import { useMemo } from 'react';

export interface EddCountdown {
  totalDaysLeft: number;
  weeksLeft: number;
  daysRemainder: number;
  isOverdue: boolean;
  isDueSoon: boolean;   // within 7 days
  isImminent: boolean;  // within 2 days
  label: string;        // human-readable summary
  urgency: 'overdue' | 'imminent' | 'soon' | 'normal';
}

/**
 * useEddCountdown
 * ---------------
 * Accepts an EDD date string (YYYY-MM-DD) and returns a reactive countdown
 * object with weeks/days remaining, urgency level and a display label.
 */
export function useEddCountdown(edd: string | null | undefined): EddCountdown | null {
  return useMemo(() => {
    if (!edd) return null;

    const eddDate = new Date(edd);
    eddDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDaysLeft = Math.round((eddDate.getTime() - today.getTime()) / 86_400_000);
    const isOverdue   = totalDaysLeft < 0;
    const isDueSoon   = !isOverdue && totalDaysLeft <= 7;
    const isImminent  = !isOverdue && totalDaysLeft <= 2;

    const absDays   = Math.abs(totalDaysLeft);
    const weeksLeft = Math.floor(absDays / 7);
    const daysRemainder = absDays % 7;

    let label: string;
    let urgency: EddCountdown['urgency'];

    if (isOverdue) {
      urgency = 'overdue';
      label = weeksLeft > 0
        ? `Overdue by ${weeksLeft}w ${daysRemainder}d`
        : `Overdue by ${absDays} day${absDays !== 1 ? 's' : ''}`;
    } else if (isImminent) {
      urgency = 'imminent';
      label = totalDaysLeft === 0 ? 'Due TODAY!' : `Due in ${totalDaysLeft} day${totalDaysLeft !== 1 ? 's' : ''}`;
    } else if (isDueSoon) {
      urgency = 'soon';
      label = `Due in ${totalDaysLeft} days`;
    } else {
      urgency = 'normal';
      label = weeksLeft > 0
        ? `${weeksLeft}w ${daysRemainder}d remaining`
        : `${daysRemainder} day${daysRemainder !== 1 ? 's' : ''} remaining`;
    }

    return { totalDaysLeft, weeksLeft, daysRemainder, isOverdue, isDueSoon, isImminent, label, urgency };
  }, [edd]);
}
