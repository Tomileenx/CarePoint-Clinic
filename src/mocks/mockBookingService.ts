// DEMO ONLY. In-memory mock that resets on every page reload. Nothing is persisted.
import type { AppointmentSlot, BookingResponse } from "@/types/booking";
import { ApiError } from "@/services/apiClient";
import type { BookingService } from "@/services/bookingService";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

function buildSlots(): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  let id = 1;
  let added = 0;
  while (added < 6) {
    day.setDate(day.getDate() + 1);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    added++;
    for (let m = 9 * 60; m < 16 * 60 + 30; m += 30) {
      if (m === 12 * 60 || m === 12 * 60 + 30) continue; // lunch
      const start = new Date(day);
      start.setMinutes(m);
      const end = new Date(start.getTime() + 30 * 60000);
      slots.push({
        id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        available: (id * 7) % 5 !== 0 && (id * 3) % 11 !== 0,
      });
      id++;
    }
  }
  return slots;
}

const slots = buildSlots();
const bookings = new Map<string, BookingResponse>();
let counter = 1000;

function seed(slot: AppointmentSlot, name: string, status: BookingResponse["status"]) {
  const b: BookingResponse = {
    id: `DEMO-${++counter}`,
    slotId: slot.id,
    patientName: name,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status,
  };
  bookings.set(b.id, b);
}
const unavailable = slots.filter((s) => !s.available);
seed(unavailable[0]!, "Demo Patient A", "CONFIRMED");
seed(unavailable[1]!, "Demo Patient B", "CANCELLED");

export const demoReferences = ["DEMO-1001", "DEMO-1002"];

export const mockBookingService: BookingService = {
  async listSlots() {
    await delay();
    return slots.map((s) => ({ ...s }));
  },
  async createBooking(req) {
    await delay(900);
    if (!req.patientName.trim() || !/^\S+@\S+\.\S+$/.test(req.patientEmail)) {
      throw new ApiError("validation", "Please provide a valid name and email address.", 400);
    }
    const slot = slots.find((s) => s.id === req.slotId);
    if (!slot) throw new ApiError("notFound", "That appointment slot could not be found.", 404);
    if (!slot.available)
      throw new ApiError("conflict", "That slot is no longer available. Please choose another.", 409);
    slot.available = false;
    const b: BookingResponse = {
      id: `DEMO-${++counter}`,
      slotId: slot.id,
      patientName: req.patientName.trim(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "CONFIRMED",
    };
    bookings.set(b.id, b);
    return { ...b };
  },
  async getBooking(id) {
    await delay();
    const b = bookings.get(id.trim().toUpperCase());
    if (!b) throw new ApiError("notFound", "No booking was found with that reference.", 404);
    return { ...b };
  },
  async cancelBooking(id) {
    await delay(800);
    const b = bookings.get(id.trim().toUpperCase());
    if (!b) throw new ApiError("notFound", "No booking was found with that reference.", 404);
    if (b.status === "CANCELLED")
      throw new ApiError("conflict", "This booking has already been cancelled.", 409);
    b.status = "CANCELLED";
    const slot = slots.find((s) => s.id === b.slotId);
    if (slot) slot.available = true;
    return { ...b };
  },
  async listBookings(page = 0, size = 10) {
    await delay();
    const all = [...bookings.values()];
    return {
      content: all.slice(page * size, page * size + size),
      page,
      size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
    };
  },
};
