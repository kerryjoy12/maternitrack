export function getFirstName(fullName?: string | null): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

const WELL_WISHES = [
  'Hope you are doing well today.',
  'Wishing you a calm and positive day.',
  'Take good care of yourself today.',
  'You are doing great — keep it up.',
  'Hope today brings you peace and good health.',
  'Sending you warm wishes for a lovely day.',
];

export interface PersonalizedGreeting {
  salutation: string;
  wish: string;
}

export function getPersonalizedGreeting(fullName?: string | null, date = new Date()): PersonalizedGreeting {
  const firstName = getFirstName(fullName);
  const salutation = `${getTimeOfDayGreeting(date)}, ${firstName}`;
  const wishIndex = (date.getDate() + date.getMonth()) % WELL_WISHES.length;
  return {
    salutation,
    wish: WELL_WISHES[wishIndex],
  };
}
