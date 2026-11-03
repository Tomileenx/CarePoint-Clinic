import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callBookingApi } from "./booking-api.server";

// Every input is validated here before anything is forwarded to the backend.
const idSchema = z.string().trim().min(1).max(128);

// GET /slots returns all slots as a plain array; the only documented parameter
// is the optional `provider` filter. The backend sorts by (start, id) ascending.
export const proxyListSlots = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({ provider: z.string().trim().min(1).max(128).optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const q = new URLSearchParams();
    if (data.provider) q.set("provider", data.provider);
    const qs = q.toString();
    return callBookingApi(`/slots${qs ? `?${qs}` : ""}`);
  });

export const proxyCreateBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        slotId: idSchema,
        name: z.string().trim().min(1).max(200),
        email: z.string().trim().email().max(254),
        idempotencyKey: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data }) =>
    callBookingApi("/bookings", {
      method: "POST",
      body: { slotId: data.slotId, name: data.name, email: data.email },
      headers: { "Idempotency-Key": data.idempotencyKey },
    }),
  );

export const proxyGetBooking = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: idSchema }).parse(d))
  .handler(async ({ data }) => callBookingApi(`/bookings/${encodeURIComponent(data.id)}`));

export const proxyCancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: idSchema }).parse(d))
  .handler(async ({ data }) =>
    callBookingApi(`/bookings/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
  );

export const proxyListBookings = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(254),
        limit: z.number().int().min(1).max(50),
        cursor: z.string().min(1).max(512).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const q = new URLSearchParams({ email: data.email, limit: String(data.limit) });
    if (data.cursor) q.set("cursor", data.cursor);
    return callBookingApi(`/bookings?${q}`);
  });
