import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callBookingApi } from "./booking-api.server";

// Every input is validated here before anything is forwarded to the backend.
const idSchema = z.string().trim().min(1).max(128);

export const proxyListSlots = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        page: z.number().int().min(0).max(10_000),
        size: z.number().int().min(1).max(50),
        sort: z.enum(["start,asc", "start,desc"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const q = new URLSearchParams({ page: String(data.page), size: String(data.size), sort: data.sort });
    return callBookingApi(`/slots?${q}`);
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
