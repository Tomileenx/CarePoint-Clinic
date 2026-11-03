import type { AppointmentSlot } from "@/types/booking";

export interface BookingFormValues {
  name: string;
  email: string;
}
export type BookingFormErrors = { [K in keyof BookingFormValues | "slot"]?: string | undefined };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (e: string) => EMAIL_RE.test(e.trim());

/** UX-only validation. The proxy and backend validate independently. */
export function validateBooking(values: BookingFormValues, slotId: string | null): BookingFormErrors {
  const errors: BookingFormErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your full name.";
  else if (values.name.trim().length > 200) errors.name = "Name is too long.";
  if (!values.email.trim()) errors.email = "Please enter your email address.";
  else if (!isValidEmail(values.email)) errors.email = "Please enter a valid email address.";
  if (slotId === null) errors.slot = "Please select an appointment slot.";
  return errors;
}

/**
 * The backend sends appointment times as wall-clock clinic times with a "Z"
 * suffix (e.g. 09:00:00Z means the 9:00 AM appointment, not 9:00 UTC as an
 * instant). Formatting in UTC preserves the backend's clock time exactly, so
 * every visitor sees the real appointment time regardless of their timezone.
 */
const CLINIC_TIME_ZONE = "UTC";

export function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Groups slots by day, preserving the order the API returned them in. */
export function groupSlotsByDate(slots: AppointmentSlot[]) {
  const groups = new Map<string, AppointmentSlot[]>();
  for (const s of slots) {
    const k = dateKey(s.start);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, slots: items }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: CLINIC_TIME_ZONE });
export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: CLINIC_TIME_ZONE });
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CLINIC_TIME_ZONE });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: CLINIC_TIME_ZONE });
