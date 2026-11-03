import type {
  AppointmentSlot,
  BookingPage,
  BookingRequest,
  BookingResponse,
} from "@/types/booking";
import {
  proxyCancelBooking,
  proxyCreateBooking,
  proxyGetBooking,
  proxyListBookings,
  proxyListSlots,
} from "@/lib/booking-api.functions";
import { ApiError, unwrap } from "./apiClient";

function required<T>(value: T | undefined): T {
  if (value === undefined || value === null) throw new ApiError("server", "The booking service returned an empty response.");
  return value;
}

export function isBookingResponse(v: unknown): v is BookingResponse {
  return !!v && typeof v === "object" && typeof (v as BookingResponse).id === "string";
}

export const bookingService = {
  async listSlots(provider?: string): Promise<AppointmentSlot[]> {
    const slots = await unwrap<AppointmentSlot[]>(proxyListSlots({ data: provider ? { provider } : {} }));
    return slots ?? [];
  },
  /**
   * The spec documents no success schema for POST /bookings, so the body is returned
   * only if it looks like a BookingResponse; otherwise null.
   */
  async createBooking(req: BookingRequest, idempotencyKey: string): Promise<BookingResponse | null> {
    const body = await unwrap<unknown>(proxyCreateBooking({ data: { ...req, idempotencyKey } }));
    return isBookingResponse(body) ? body : null;
  },
  async getBooking(id: string): Promise<BookingResponse> {
    return required(await unwrap<BookingResponse>(proxyGetBooking({ data: { id } })));
  },
  async cancelBooking(id: string): Promise<BookingResponse> {
    return required(await unwrap<BookingResponse>(proxyCancelBooking({ data: { id } })));
  },
  async listBookings(email: string, limit: number, cursor?: string): Promise<BookingPage> {
    return required(
      await unwrap<BookingPage>(proxyListBookings({ data: { email, limit, ...(cursor ? { cursor } : {}) } })),
    );
  },
};
