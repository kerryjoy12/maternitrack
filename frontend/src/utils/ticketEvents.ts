export const TICKET_RESOLVED_EVENT = 'ticket-resolved';

export function emitTicketResolved() {
  window.dispatchEvent(new CustomEvent(TICKET_RESOLVED_EVENT));
}

export function onTicketResolved(callback: () => void) {
  window.addEventListener(TICKET_RESOLVED_EVENT, callback);
  return () => window.removeEventListener(TICKET_RESOLVED_EVENT, callback);
}
