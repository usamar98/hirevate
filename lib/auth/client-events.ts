export const AUTH_STATUS_CHANGED_EVENT = "hirevate:auth-status-changed";

export function notifyAuthStatusChanged() {
  window.dispatchEvent(new Event(AUTH_STATUS_CHANGED_EVENT));
}
