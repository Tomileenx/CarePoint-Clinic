import { z } from "zod";

// Incoming request validation and documented response fields share one boundary.
export const bookingRequestSchema = z.object({
  slotId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.string().trim().min(1).email(),
}).strict();
export const bookingIdSchema = z.object({ id: z.string().trim().min(1) }).strict();
export const slotsRequestSchema = z.object({ provider: z.string().optional() }).strict();
export const bookingsRequestSchema = z.object({
  email: z.string().trim().email(),
  limit: z.number().int().positive().max(2147483647).default(10),
  cursor: z.string().optional(),
}).strict();
export const createBookingSchema = bookingRequestSchema.extend({ idempotencyKey: z.string().uuid() });

const timestamp = z.string().datetime({ offset: true });
export const slotSchema = z.object({
  id: z.string(), provider: z.string(), start: timestamp, end: timestamp, available: z.boolean(),
});
export const bookingResponseSchema = z.object({
  id: z.string(), slotId: z.string(), name: z.string(), email: z.string(),
  status: z.enum(["CONFIRMED", "CANCELLED"]), createdAt: timestamp,
});
// Existing cursor contract, explicitly confirmed in the user's redeployment brief.
// The current live annotation still incorrectly points to BookingResponse.
export const bookingPageSchema = z.object({
  items: z.array(bookingResponseSchema), next_cursor: z.string().nullish(),
});