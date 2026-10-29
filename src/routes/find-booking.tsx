import { createFileRoute } from "@tanstack/react-router";
import { FindBookingPage } from "@/pages/FindBookingPage";

export const Route = createFileRoute("/find-booking")({
  validateSearch: (s: Record<string, unknown>): { ref?: string } =>
    typeof s["ref"] === "string" && s["ref"] ? { ref: s["ref"] } : {},
  head: () => ({
    meta: [
      { title: "Find Your Booking — CarePoint Clinic" },
      { name: "description", content: "Look up or cancel a CarePoint Clinic appointment with your booking reference." },
      { property: "og:title", content: "Find Your Booking — CarePoint Clinic" },
      { property: "og:description", content: "Look up or cancel a CarePoint Clinic appointment with your booking reference." },
    ],
  }),
  component: FindBookingRoute,
});

function FindBookingRoute() {
  const { ref } = Route.useSearch();
  return <FindBookingPage {...(ref ? { initialRef: ref } : {})} />;
}
