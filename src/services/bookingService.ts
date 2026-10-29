import type {
  AppointmentSlot,
  BookingRequest,
  BookingResponse,
  PaginatedBookingResponse,
} from "@/types/booking";
import { mockBookingService } from "@/mocks/mockBookingService";
import { ApiError, apiRequest } from "./apiClient";
import { isMockMode } from "./config";

export interface BookingService {
  listSlots(): Promise<AppointmentSlot[]>;
  createBooking(req: BookingRequest): Promise<BookingResponse>;
  getBooking(id: string): Promise<BookingResponse>;
  /** Returns the updated booking, or null when the API replies 204 with no body. */
  cancelBooking(id: string): Promise<BookingResponse | null>;
  /** For authorized clinic/admin views only — not used by public pages. */
  listBookings(page?: number, size?: number): Promise<PaginatedBookingResponse>;
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new ApiError("server", "The booking service returned an empty response.");
  return value;
}

const httpBookingService: BookingService = {
  async listSlots() {
    return required(await apiRequest<AppointmentSlot[]>("/slots"));
  },
  async createBooking(req) {
    return required(
      await apiRequest<BookingResponse>("/bookings", { method: "POST", body: JSON.stringify(req) }),
    );
  },
  async getBooking(id) {
    return required(await apiRequest<BookingResponse>(`/bookings/${encodeURIComponent(id)}`));
  },
  async cancelBooking(id) {
    const res = await apiRequest<BookingResponse>(`/bookings/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res ?? null;
  },
  async listBookings(page = 0, size = 10) {
    return required(
      await apiRequest<PaginatedBookingResponse>(`/bookings?page=${page}&size=${size}`),
    );
  },
};

export const bookingService: BookingService = isMockMode ? mockBookingService : httpBookingService;
