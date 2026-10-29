import { describe, expect, it } from "vitest";
import { validateBooking } from "@/lib/booking-utils";

describe("booking form validation", () => {
  it("rejects a blank full name", () => {
    expect(validateBooking({ patientName: "   ", patientEmail: "a@b.com" }, 1).patientName).toBeDefined();
  });
  it("rejects an invalid email", () => {
    expect(validateBooking({ patientName: "Jo", patientEmail: "jo@nope" }, 1).patientEmail).toBeDefined();
  });
  it("requires a selected slot", () => {
    expect(validateBooking({ patientName: "Jo", patientEmail: "jo@x.com" }, null).slot).toBeDefined();
  });
  it("accepts valid input", () => {
    expect(validateBooking({ patientName: "John Doe", patientEmail: "john@example.com" }, 1)).toEqual({});
  });
});
