// Types mirror the backend OpenAPI spec (https://booking-api-ngrf.onrender.com/v3/api-docs) exactly.

export type BookingStatus = "CONFIRMED" | "CANCELLED";

/** components.schemas.AppointmentSlotResponse */
export interface AppointmentSlot {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

/** components.schemas.PageAppointmentSlotResponse (fields used by the UI) */
export interface SlotPage {
  content: AppointmentSlot[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** components.schemas.BookingRequest */
export interface BookingRequest {
  slotId: string;
  name: string;
  email: string;
}

/** components.schemas.BookingResponse */
export interface BookingResponse {
  id: string;
  slotId: string;
  name: string;
  email: string;
  status: BookingStatus;
  createdAt: string;
}

/** components.schemas.BookingPage */
export interface BookingPage {
  items: BookingResponse[];
  next_cursor?: string | null;
}

/** components.schemas.ErrorResponse */
export interface ApiErrorResponse {
  error?: string;
  code?: string;
  now?: string;
}

/** Only `start` is a documented sort property (spec default: start,ASC). */
export const SLOT_SORTS = ["start,asc", "start,desc"] as const;
export type SlotSort = (typeof SLOT_SORTS)[number];
