import { describe, expect, it } from "vitest";
import { dateKey, formatTime, groupSlotsByDate } from "@/lib/booking-utils";
import type { AppointmentSlot } from "@/types/booking";

// The backend sends appointment wall-clock times with a "Z" suffix:
// "2026-11-02T09:00:00Z" is the 9:00 AM appointment. The UI must show that
// clock time exactly, in any viewer timezone (run with TZ=Africa/Lagos too).
describe("appointment time display", () => {
  it("shows the backend's 09:00 slot as 09:00, not shifted by timezone", () => {
    expect(formatTime("2026-11-02T09:00:00Z")).toBe("09:00");
  });

  it("shows a 16:30 slot as 16:30", () => {
    expect(formatTime("2026-11-02T16:30:00Z")).toBe("16:30");
  });

  it("groups slots by the backend's calendar date", () => {
    expect(dateKey("2026-11-02T09:00:00Z")).toBe("2026-11-02");
  });

  it("keeps the backend's slot order when grouping", () => {
    const slot = (id: string, start: string): AppointmentSlot => ({
      id,
      provider: "Dr Ade",
      start,
      end: start,
      available: true,
    });
    const slots = [
      slot("a", "2026-11-02T09:00:00Z"),
      slot("b", "2026-11-02T10:00:00Z"),
      slot("c", "2026-11-03T09:00:00Z"),
    ];
    const groups = groupSlotsByDate(slots);
    expect(groups.map((g) => g.key)).toEqual(["2026-11-02", "2026-11-03"]);
    expect(groups[0]!.slots.map((s) => s.id)).toEqual(["a", "b"]);
  });
});
