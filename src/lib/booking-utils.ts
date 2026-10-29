import type { AppointmentSlot } from "@/types/booking";

export interface BookingFormValues {
  patientName: string;
  patientEmail: string;
}
export type BookingFormErrors = Partial<Record<keyof BookingFormValues | "slot", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** UX-only validation. The backend must validate independently. */
export function validateBooking(values: BookingFormValues, slotId: number | null): BookingFormErrors {
  const errors: BookingFormErrors = {};
  if (!values.patientName.trim()) errors.patientName = "Please enter your full name.";
  if (!values.patientEmail.trim()) errors.patientEmail = "Please enter your email address.";
  else if (!EMAIL_RE.test(values.patientEmail.trim()))
    errors.patientEmail = "Please enter a valid email address.";
  if (slotId === null) errors.slot = "Please select an appointment slot.";
  return errors;
}

export function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function groupSlotsByDate(slots: AppointmentSlot[]) {
  const groups = new Map<string, AppointmentSlot[]>();
  for (const s of [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    const k = dateKey(s.startTime);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, slots: items }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
