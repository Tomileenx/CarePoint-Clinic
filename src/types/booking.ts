// API and domain types. Keep these aligned with the Java backend contract once finalized.

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export interface AppointmentSlot {
  id: number;
  /** ISO-8601 date-time */
  startTime: string;
  /** ISO-8601 date-time */
  endTime: string;
  available: boolean;
}

export interface BookingRequest {
  slotId: number;
  patientName: string;
  patientEmail: string;
}

export interface BookingResponse {
  /** Identifier / reference returned by the backend. */
  id: string;
  slotId: number;
  patientName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export interface PaginatedBookingResponse {
  content: BookingResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
