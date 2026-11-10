import { AppointmentStatus, ClinicStage, RiskLevel } from '../types';

export { getPersonalizedGreeting, getFirstName, getTimeOfDayGreeting } from './personalizedGreeting';
export type { PersonalizedGreeting } from './personalizedGreeting';

export function extractListData<T>(data: T[] | { results?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function daysFromNow(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export const STAGE_LABELS: Record<ClinicStage, string> = {
  ANC1: 'ANC 1', ANC2: 'ANC 2', ANC3: 'ANC 3', ANC4: 'ANC 4',
  DELIVERED: 'Delivered', POSTNATAL: 'Postnatal',
};
export const STAGE_COLORS: Record<ClinicStage, string> = {
  ANC1: 'primary', ANC2: 'primary', ANC3: 'purple', ANC4: 'purple',
  DELIVERED: 'success', POSTNATAL: 'success',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'danger',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  UPCOMING: 'warning', ATTENDED: 'success', MISSED: 'danger',
  RESCHEDULED: 'purple', CANCELLED: 'neutral',
};

export const APPT_TYPE_LABELS: Record<string, string> = {
  ANC1: 'ANC Visit 1', ANC2: 'ANC Visit 2', ANC3: 'ANC Visit 3', ANC4: 'ANC Visit 4',
  POSTNATAL_7DAY: 'Postnatal 7-Day', POSTNATAL_6WEEK: 'Postnatal 6-Week', OTHER: 'Other',
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
