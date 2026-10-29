import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, SearchX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DemoBanner, DetailRow, ErrorNotice, StatusBadge } from "@/components/booking/Feedback";
import { bookingService } from "@/services/bookingService";
import { ApiError } from "@/services/apiClient";
import { formatDate, formatTime } from "@/lib/booking-utils";
import type { BookingResponse } from "@/types/booking";
import { slotsQueryKey } from "./BookingPage";
import { demoReferences } from "@/mocks/mockBookingService";
import { isMockMode } from "@/services/config";

export function FindBookingPage({ initialRef }: { initialRef?: string }) {
  const qc = useQueryClient();
  const [reference, setReference] = useState(initialRef ?? "");
  const [inputError, setInputError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const lookup = useMutation({
    mutationFn: (id: string) => bookingService.getBooking(id),
    onMutate: () => { setBooking(null); setCancelled(false); cancel.reset(); },
    onSuccess: setBooking,
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => (await bookingService.cancelBooking(id)) ?? bookingService.getBooking(id),
    onSuccess: (b) => {
      setBooking(b);
      setCancelled(true);
      qc.invalidateQueries({ queryKey: slotsQueryKey });
    },
  });

  const search = (e?: React.FormEvent) => {
    e?.preventDefault();
    const ref = reference.trim();
    if (!ref) return setInputError("Please enter your booking reference.");
    setInputError(null);
    lookup.mutate(ref);
  };

  useEffect(() => {
    if (initialRef) lookup.mutate(initialRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef]);

  const notFound = lookup.error instanceof ApiError && lookup.error.kind === "notFound";

  return (
    <div>
      <section className="bg-hero border-b">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal">Manage</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Find your booking</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Enter the booking reference from your confirmation to view or cancel your appointment.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
        {isMockMode && (
          <DemoBanner>Demo mode: try sample references {demoReferences.join(" or ")}, or one you just booked.</DemoBanner>
        )}
        <form noValidate onSubmit={search} className="rounded-2xl border bg-card p-6 shadow-soft">
          <Label htmlFor="reference">Booking reference</Label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? "ref-error" : undefined}
              placeholder="e.g. DEMO-1001"
              className="h-10 font-mono"
            />
            <Button type="submit" size="lg" disabled={lookup.isPending}>
              {lookup.isPending ? <Loader2 className="animate-spin" /> : <Search />} Find booking
            </Button>
          </div>
          {inputError && <p id="ref-error" className="mt-2 text-sm text-destructive">{inputError}</p>}
        </form>

        <div aria-live="polite" className="space-y-4">
          {lookup.isPending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Looking up your booking…</p>
          )}
          {notFound && (
            <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
              <SearchX className="size-10 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-medium">No booking found</p>
              <p className="mt-1 text-sm text-muted-foreground">Check the reference and try again.</p>
            </div>
          )}
          {lookup.isError && !notFound && <ErrorNotice title="Lookup failed" error={lookup.error} onRetry={() => search()} />}

          {booking && (
            <article className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Booking details</h2>
                <StatusBadge status={booking.status} />
              </div>
              <dl className="mt-3 divide-y">
                <DetailRow label="Reference" value={<span className="font-mono">{booking.id}</span>} />
                <DetailRow label="Patient" value={booking.patientName} />
                <DetailRow label="Date" value={formatDate(booking.startTime)} />
                <DetailRow label="Time" value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`} />
              </dl>

              {cancelled && (
                <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
                  <CheckCircle2 className="size-4" /> Your booking has been cancelled.
                </p>
              )}
              {cancel.isError && <div className="mt-4"><ErrorNotice title="Cancellation failed" error={cancel.error} /></div>}

              {booking.status === "CONFIRMED" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="mt-5 w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive" disabled={cancel.isPending}>
                      {cancel.isPending ? <><Loader2 className="animate-spin" /> Cancelling…</> : "Cancel booking"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {formatDate(booking.startTime)} at {formatTime(booking.startTime)}. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep booking</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => cancel.mutate(booking.id)}
                      >
                        Yes, cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
